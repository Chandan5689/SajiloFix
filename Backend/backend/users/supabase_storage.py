from supabase import create_client
from django.conf import settings
from django.core.files.storage import Storage
from io import BytesIO
import os


class SupabaseStorage(Storage):
    """
    Custom storage backend for Django that uses Supabase Storage.
    This allows Django to store files in Supabase cloud storage
    instead of the local filesystem.
    """
    
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        # Prefer SUPABASE_KEY, fallback to SUPABASE_ANON_KEY
        self.supabase_key = getattr(settings, 'SUPABASE_KEY', None) or getattr(settings, 'SUPABASE_ANON_KEY', '')
        self.client = create_client(self.supabase_url, self.supabase_key)
    
    def _get_bucket_name(self, name):
        """
        Extract bucket name from full path.
        Path format: profile-pictures/profile_1.jpg
        Returns: profile-pictures
        """
        parts = name.split('/')
        return parts[0]
    
    def _get_file_path(self, name):
        """
        Get file path without bucket name.
        Path format: profile-pictures/profile_1.jpg
        Returns: profile_1.jpg
        """
        parts = name.split('/', 1)
        return parts[1] if len(parts) > 1 else parts[0]
    
    def _open(self, name, mode='rb'):
        """
        Open and read a file from Supabase.
        
        Args:
            name: Full path including bucket name (e.g., 'profile-pictures/profile_1.jpg')
            mode: File open mode (default: 'rb' for read binary)
        
        Returns:
            BytesIO object containing file content
        """
        bucket = self._get_bucket_name(name)
        file_path = self._get_file_path(name)
        
        try:
            response = self.client.storage.from_(bucket).download(file_path)
            return BytesIO(response)
        except Exception as e:
            raise FileNotFoundError(f"File {name} not found in Supabase: {str(e)}")
    
    def _save(self, name, content):
        """
        Save a file to Supabase.
        
        Args:
            name: Full path including bucket name (e.g., 'profile-pictures/profile_1.jpg')
            content: File content (can be bytes or file-like object)
        
        Returns:
            name: The saved file path
        """
        bucket = self._get_bucket_name(name)
        file_path = self._get_file_path(name)
        
        try:
            # Read content if it's a file-like object
            if hasattr(content, 'read'):
                file_content = content.read()
            else:
                file_content = content
            
            # Upload to Supabase with upsert to overwrite if exists
            self.client.storage.from_(bucket).upload(
                file_path,
                file_content,
                {"upsert": "true"}
            )
            return name
        except Exception as e:
            raise Exception(f"Failed to save file {name} to Supabase: {str(e)}")
    
    def delete(self, name):
        """
        Delete a file from Supabase.
        
        Args:
            name: Full path including bucket name (e.g., 'profile-pictures/profile_1.jpg')
        """
        bucket = self._get_bucket_name(name)
        file_path = self._get_file_path(name)
        
        try:
            self.client.storage.from_(bucket).remove([file_path])
        except Exception as e:
            raise Exception(f"Failed to delete file {name} from Supabase: {str(e)}")
    
    def exists(self, name):
        """
        Check if a file exists in Supabase.
        
        Args:
            name: Full path including bucket name
        
        Returns:
            bool: True if file exists, False otherwise
        """
        try:
            bucket = self._get_bucket_name(name)
            file_path = self._get_file_path(name)
            self.client.storage.from_(bucket).download(file_path)
            return True
        except:
            return False
    
    def url(self, name):
        """
        Return the public URL for a file in Supabase.
        
        Args:
            name: Full path including bucket name
        
        Returns:
            str: Public URL to access the file
        """
        bucket = self._get_bucket_name(name)
        file_path = self._get_file_path(name)
        return f"{self.supabase_url}/storage/v1/object/public/{bucket}/{file_path}"
    
    def size(self, name):
        """
        Get the size of a file. 
        Note: Supabase doesn't provide easy size access, so this is a placeholder.
        
        Args:
            name: Full path including bucket name
        
        Returns:
            int or None: File size or None if not available
        """
        return None
    
    def listdir(self, path):
        """
        List contents of a directory in Supabase.
        
        Args:
            path: Directory path (format: bucket-name/path)
        
        Returns:
            tuple: (directories, files) lists
        """
        bucket = path.split('/')[0]
        try:
            response = self.client.storage.from_(bucket).list(path)
            files = [item['name'] for item in response if item['name']]
            return [], files
        except Exception as e:
            raise Exception(f"Failed to list directory {path}: {str(e)}")
