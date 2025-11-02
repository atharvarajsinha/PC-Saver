from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from cryptography.fernet import InvalidToken

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_("The Email field must be set"))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=100)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # no username required

    objects = CustomUserManager()

    def __str__(self):
        return self.email


class UserDatabase(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="databases")
    host = models.CharField(max_length=100)
    port = models.IntegerField(default=5432)
    dbname = models.CharField(max_length=100)
    username = models.CharField(max_length=100)
    _password = models.BinaryField(db_column="password")
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        self._password = settings.FERNET.encrypt(raw_password.encode())

    def get_password(self):
        try:
            token = self._password
            if isinstance(token, memoryview):
                token = bytes(token)
            return settings.FERNET.decrypt(token).decode()
        except InvalidToken:
            return None

    password = property(get_password, set_password)

    def __str__(self):
        return f"{self.dbname} ({self.user.email})"


class PoolerConfig(models.Model):
    user_db = models.OneToOneField(UserDatabase, on_delete=models.CASCADE, related_name="pool_config")
    pool_size = models.IntegerField(default=10)
    queue_size = models.IntegerField(default=20)
    queue_timeout_ms = models.IntegerField(default=5000)

    def __str__(self):
        return f"PoolConfig for {self.user_db.dbname}"
