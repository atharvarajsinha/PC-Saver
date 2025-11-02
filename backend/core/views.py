from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer, UserDatabaseSerializer
from .models import UserDatabase, PoolerConfig
from django.db.models import Avg
import psycopg2
from psycopg2 import OperationalError
import time
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from .pooler_engine.pool_manager import ConnectionPooler
from .pooler_engine.db_client import execute_db_query
import concurrent.futures
import psutil

User = get_user_model()

def response(success, message, data=None, status_code=status.HTTP_200_OK):
    return Response({"success": success, "message": message, "data": data}, status=status_code)

@api_view(["GET"])
def public_stats(request):
    users_registered = User.objects.count()
    databases_connected = UserDatabase.objects.count()
    pool_stats = PoolerConfig.objects.aggregate(
        avg_pool_size = Avg("pool_size"),
        avg_queue_size = Avg("queue_size"),
        avg_timeout_ms = Avg("queue_timeout_ms"),
    )

    data = {
        "users_registered": users_registered,
        "databases_connected": databases_connected,
        "avg_pool_size": round(pool_stats["avg_pool_size"] or 0, 2),
        "avg_queue_size": round(pool_stats["avg_queue_size"] or 0, 2),
        "avg_timeout_ms": round(pool_stats["avg_timeout_ms"] or 0, 2),
    }
    return response(True,"Stats loaded successfully",data,200)

@api_view(["POST"])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return response(True, "User registered successfully", serializer.data)
    return response(False, "Registration failed", serializer.errors, 400)

@api_view(["POST"])
def login_user(request):
    email = request.data.get("email")
    password = request.data.get("password")

    user = authenticate(request, email=email, password=password)
    if not user:
        return response(False, "Invalid email or password", None, 400)

    refresh = RefreshToken.for_user(user)
    return response(True, "Login successful", {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_details(request):
    return response(True, "User details fetched", UserSerializer(request.user).data)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_user_details(request):
    user = request.user
    user.full_name = request.data.get("full_name", user.full_name)
    user.save()
    return response(True, "User details updated", UserSerializer(user).data)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")
    confirm_password = request.data.get("confirm_password")

    if not user.check_password(old_password):
        return response(False, "Old password is incorrect", None, 400)
    if new_password != confirm_password:
        return response(False, "Passwords do not match", None, 400)

    user.set_password(new_password)
    user.save()
    return response(True, "Password changed successfully", UserSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_database(request):
    serializer = UserDatabaseSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        db = serializer.save()
        return response(True, "Database registered successfully", UserDatabaseSerializer(db).data)
    return response(False, "Invalid data", serializer.errors, 400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_databases(request):
    dbs = UserDatabase.objects.filter(user=request.user)
    serializer = UserDatabaseSerializer(dbs, many=True)
    return response(True, "Databases fetched successfully", serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_database(request, db_id):
    try:
        db = UserDatabase.objects.get(id=db_id, user=request.user)
    except UserDatabase.DoesNotExist:
        return response(False, "Database not found", None, 404)
    return response(True, "Database fetched successfully", UserDatabaseSerializer(db).data)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_database(request, db_id):
    try:
        db = UserDatabase.objects.get(id=db_id, user=request.user)
    except UserDatabase.DoesNotExist:
        return response(False, "Database not found", None, 404)
    serializer = UserDatabaseSerializer(db, data=request.data, partial=True, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        return response(True, "Database updated successfully", serializer.data)
    return response(False, "Update failed", serializer.errors, 400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_database(request, db_id):
    try:
        db = UserDatabase.objects.get(id=db_id, user=request.user)
        db.delete()
        return response(True, "Database deleted successfully")
    except UserDatabase.DoesNotExist:
        return response(False, "Database not found", None, 404)
    

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reveal_database_password(request, db_id):
    db = get_object_or_404(UserDatabase, id=db_id, user=request.user)

    confirm_pwd = request.data.get("password")
    if not confirm_pwd:
        return response(False, "Password is required", None, 400)

    user = request.user
    if not user.check_password(confirm_pwd):
        return response(False, "Account password incorrect", None, 403)

    # get decrypted password from model property (uses Fernet)
    decrypted = db.password
    return response(True, "Database password retrieved", {"password": decrypted})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def test_database_connection(request, db_id):
    try:
        db = UserDatabase.objects.get(id=db_id, user=request.user)
    except UserDatabase.DoesNotExist:
        return response(False, "Database not found", None, 404)

    host = db.host
    port = db.port
    username = db.username
    password = db.password
    dbname = db.dbname

    start_time = time.time()
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            dbname=dbname,
            connect_timeout=5
        )
        conn.close()
        latency = round((time.time() - start_time) * 1000, 2)
        return response(True, "Connection successful", {"latency_ms": latency})
    except OperationalError as e:
        return response(False, "Connection failed", {"error": str(e)}, 400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def test_with_pooler(request, db_id):
    """
    Run parallel requests using the Python pooler engine.
    The query is defined internally, not from the request body.
    """
    
    try:
        user_db = UserDatabase.objects.get(id=db_id, user=request.user)
    except UserDatabase.DoesNotExist:
        return response(False, "Database not found", None, 404)

    num_requests = int(request.data.get("num_requests", 10))

    # Define a fixed test query
    query =  """
    SELECT 
        schemaname, tablename, tableowner,
        tablespace, hasindexes, hasrules 
    FROM pg_tables 
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
    LIMIT 15;
    """

    # Initialize pooler
    pooler = ConnectionPooler(user_db)
    metrics = pooler.execute_requests(query, num_requests)

    return response(True, "Test with pooler completed", {
        "pool_config": {
            "pool_size": pooler.pool_size,
            "queue_size": pooler.queue_size,
            "queue_timeout_ms": pooler.queue_timeout * 1000
        },
        "metrics": metrics
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def test_without_pooler(request, db_id):
    """
    Run parallel queries directly (no pooling, direct DB connections).
    """
    try:
        user_db = UserDatabase.objects.get(id=db_id, user=request.user)
    except UserDatabase.DoesNotExist:
        return response(False, "Database not found", None, 404)

    num_requests = int(request.data.get("num_requests", 10))

    query =  """
    SELECT 
        schemaname, tablename, tableowner,
        tablespace, hasindexes, hasrules 
    FROM pg_tables 
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
    LIMIT 15;
    """

    start_time = time.time()

    # Parallel execution without pooling
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_requests) as executor:
        futures = [executor.submit(execute_db_query, user_db, query) for _ in range(num_requests)]
        for f in futures:
            try:
                f.result()
            except Exception:
                pass

    total_time = (time.time() - start_time) * 1000

    return response(True, "Test without pooler completed", {
        "metrics": {
            "successful_requests": num_requests,
            "failed_connections": 0,
            "avg_queue_wait_ms": 0,
            "total_execution_time_ms": total_time
        }
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def compare_pooling(request, db_id):
    try:
        user_db = UserDatabase.objects.get(id=db_id, user=request.user)
    except UserDatabase.DoesNotExist:
        return response(False, "Database not found", None, 404)

    num_requests = int(request.data.get("num_requests", 50))

    # Configuration
    custom_config = {
        "pool_size": user_db.pool_config.pool_size,
        "queue_size": user_db.pool_config.queue_size,
        "queue_timeout_ms": user_db.pool_config.queue_timeout_ms,
    }

    query = """
        SELECT 
            schemaname, tablename, tableowner,
            tablespace, hasindexes, hasrules 
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        LIMIT 15;
    """

    process = psutil.Process()
    
    # With Pooler
    cpu_before = psutil.cpu_percent(interval=0.1)
    mem_before = process.memory_info().rss / (1024 * 1024)
    start_time = time.time()

    pooler = ConnectionPooler(user_db, custom_config)
    pooler_results = pooler.execute_requests(query, num_requests)

    total_time_pooler = (time.time() - start_time) * 1000
    cpu_after = psutil.cpu_percent(interval=0.1)
    mem_after = process.memory_info().rss / (1024 * 1024)

    pooler_cpu = round((cpu_after + cpu_before) / 2, 2)
    pooler_mem_usage = round(mem_after - mem_before, 2)
    
    connections_created_pooler = pooler_results["connections_created"]
    connections_reused = pooler_results["connections_reused"]
    connection_reuse_rate = pooler_results["connection_reuse_rate"]
    
    memory_per_connection_pooler = (
        pooler_mem_usage / connections_created_pooler 
        if connections_created_pooler > 0 else 0
    )

    # Without Pooler
    successful_from_pooler = pooler_results["successful_requests"]
    cpu_before2 = psutil.cpu_percent(interval=0.1)
    mem_before2 = process.memory_info().rss / (1024 * 1024)
    start_time2 = time.time()

    success_count_direct = 0
    def execute_direct_query():
        nonlocal success_count_direct
        try:
            execute_db_query(user_db, query)
            success_count_direct += 1
        except Exception as e:
            print(f"Direct query error: {e}")

    with concurrent.futures.ThreadPoolExecutor(
        max_workers=min(successful_from_pooler, 20)
    ) as executor:
        futures = [
            executor.submit(execute_direct_query) 
            for _ in range(successful_from_pooler)
        ]
        for f in futures:
            try:
                f.result(timeout=10)
            except Exception:
                pass

    total_time_direct = (time.time() - start_time2) * 1000
    cpu_after2 = psutil.cpu_percent(interval=0.1)
    mem_after2 = process.memory_info().rss / (1024 * 1024)

    direct_cpu = round((cpu_after2 + cpu_before2) / 2, 2)
    direct_mem_usage = round(mem_after2 - mem_before2, 2)
    
    # Calculate memory for direct connections
    connections_created_direct = success_count_direct
    memory_per_connection_direct = (
        direct_mem_usage / connections_created_direct 
        if connections_created_direct > 0 else 0
    )

    # Accurate Memory Data
    estimated_direct_memory = memory_per_connection_direct * num_requests
    actual_pooler_memory = pooler_mem_usage
    memory_saved = max(0, estimated_direct_memory - actual_pooler_memory)
    memory_saving_percent = (
        round((memory_saved / estimated_direct_memory) * 100, 2) 
        if estimated_direct_memory > 0 else 0
    )

    # Efficiency calculations
    efficiency_with = (
        round(pooler_results["successful_requests"] / (total_time_pooler / 1000), 2)
        if total_time_pooler > 0 else 0
    )
    efficiency_without = (
        round(success_count_direct / (total_time_direct / 1000), 2)
        if total_time_direct > 0 else 0
    )
    improvement = (
        round((total_time_direct - total_time_pooler) / total_time_direct * 100, 2)
        if total_time_direct > 0 else 0
    )

    # Response
    comparison = {
        "with_pooler": {
            **pooler_results,
            "cpu_usage_percent": pooler_cpu,
            "memory_usage_mb": pooler_mem_usage,
            "efficiency_rps": efficiency_with,
            "success_rate": round(
                (pooler_results["successful_requests"] / num_requests) * 100, 2
            ),
            "connections_created": connections_created_pooler,
            "connections_reused": connections_reused,
            "connection_reuse_rate": connection_reuse_rate,
            "memory_per_connection_mb": round(memory_per_connection_pooler, 2),
            "pool_size_configured": custom_config["pool_size"]
        },
        "without_pooler": {
            "successful_requests": success_count_direct,
            "cpu_usage_percent": direct_cpu,
            "memory_usage_mb": direct_mem_usage,
            "efficiency_rps": efficiency_without,
            "total_execution_time_ms": total_time_direct,
            "success_rate": round(
                (success_count_direct / successful_from_pooler) * 100, 2
            ) if successful_from_pooler > 0 else 0,
            "connections_created": connections_created_direct,
            "memory_per_connection_mb": round(memory_per_connection_direct, 2),
            "estimated_memory_all_requests_mb": round(estimated_direct_memory, 2)
        },
        "improvement_percent": improvement,
        "resource_comparison": {
            "cpu_saving_percent": round(
                max(0, (direct_cpu - pooler_cpu) / direct_cpu * 100), 2
            ) if direct_cpu else 0,
            "memory_saving_percent": memory_saving_percent,
            "memory_saved_mb": round(memory_saved, 2),
            "connection_efficiency": {
                "reuse_rate_percent": connection_reuse_rate,
                "connections_saved": connections_reused,
                "memory_per_connection_saving": round(
                    memory_per_connection_direct - memory_per_connection_pooler, 2
                ),
                "actual_vs_expected_reuse": (
                    f"Expected to save {num_requests - custom_config['pool_size']} connections, "
                    f"actually saved {connections_reused} through reuse"
                )
            }
        },
        "interpretation": (
            f"Connection pooling created {connections_created_pooler} connections (out of {custom_config['pool_size']} max) "
            f"and reused them {connections_reused} times ({connection_reuse_rate}% reuse rate). "
            f"This saved approximately {round(memory_saved, 2)}MB of memory "
            f"and improved performance by {improvement}% compared to creating new connections for each request."
        ),
    }

    return response(
        True, 
        "Comparison completed with actual connection reuse tracking", 
        comparison
    )