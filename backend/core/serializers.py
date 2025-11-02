from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserDatabase, PoolerConfig

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "password", "full_name"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name"]


class PoolerConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PoolerConfig
        fields = ["id", "pool_size", "queue_size", "queue_timeout_ms"]
        read_only_fields = ["id"]


class UserDatabaseSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    pool_config = PoolerConfigSerializer(required=False)

    class Meta:
        model = UserDatabase
        fields = [
            "id", "host", "port", "dbname", "username", 
            "password", "created_at", "pool_config"
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        pool_data = validated_data.pop("pool_config", None)
        password = validated_data.pop("password", None)
        user = self.context["request"].user

        # Create database instance
        db_instance = UserDatabase(user=user, **validated_data)
        
        if password:
            db_instance.set_password(password)
        
        db_instance.save()

        # Create pool config with provided data or defaults
        if pool_data:
            PoolerConfig.objects.create(user_db=db_instance, **pool_data)
        else:
            # Create with default values
            PoolerConfig.objects.create(user_db=db_instance)
            
        return db_instance

    def update(self, instance, validated_data):
        pool_data = validated_data.pop("pool_config", None)
        password = validated_data.pop("password", None)

        # Update main DB fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        # Update pool config if provided
        if pool_data:
            pool_config, created = PoolerConfig.objects.get_or_create(
                user_db=instance,
                defaults=pool_data
            )
            if not created:
                # Update existing pool config
                for attr, value in pool_data.items():
                    setattr(pool_config, attr, value)
                pool_config.save()

        return instance


# class TestResultSerializer(serializers.ModelSerializer):
#     user_db_name = serializers.CharField(source='user_db.dbname', read_only=True)
    
#     class Meta:
#         model = TestResult
#         fields = [
#             "id", "user_db", "user_db_name", "test_type", "total_requests",
#             "successful_requests", "failed_connections", "avg_queue_wait_ms",
#             "total_execution_time_ms", "timestamp"
#         ]
#         read_only_fields = ["id", "timestamp"]