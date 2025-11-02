from django.urls import path
from . import views

urlpatterns = [
    # HomePage
    path("stats/", views.public_stats, name="stats"),

    # Auth Pages
    path("register/", views.register_user, name="register"),
    path("login/", views.login_user, name="login"),
    
    # Database Page
    path("databases/", views.list_databases, name="list-databases"),
    path("databases/create/", views.create_database, name="create-database"),
    path("databases/<int:db_id>/", views.get_database, name="get-database"),
    path("databases/<int:db_id>/update/", views.update_database, name="update-database"),
    path("databases/<int:db_id>/delete/", views.delete_database, name="delete-database"),
    path("databases/<int:db_id>/reveal-password/", views.reveal_database_password, name="reveal-database-password"),
    path("databases/<int:db_id>/test/", views.test_database_connection, name="test_database_connection"),
    
    # Test Page
    path("test-pooler/<int:db_id>/", views.test_with_pooler, name="execute-pooler-query"),
    path("test-direct/<int:db_id>/", views.test_without_pooler, name="execute-direct-query"),
    
    # Compare Page
    path("compare-pooler/<int:db_id>/", views.compare_pooling, name="compare-pooler-vs-direct"),
    
    # User Setting Page
    path("update/", views.update_user_details, name="update-user"),
    path("change-password/", views.change_password, name="change-password"),
    path("me/", views.get_user_details, name="user-details"),
]
