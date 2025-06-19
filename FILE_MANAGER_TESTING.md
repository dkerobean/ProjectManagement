## File Manager API Testing

You can test the file manager APIs using these steps:

### 1. Test File List API
```bash
curl -X GET "http://localhost:3001/api/files" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "list": [],
  "directory": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 0,
    "totalPages": 0
  }
}
```

### 2. Test File Upload API
```bash
# Create a test file first
echo "Hello World" > test.txt

# Upload the file
curl -X POST "http://localhost:3001/api/files/upload" \
  -F "files=@test.txt"
```

Expected response:
```json
{
  "success": true,
  "files": [
    {
      "id": "...",
      "name": "test.txt",
      "fileName": "...",
      "url": "/uploads/...",
      "size": 11,
      "type": "text/plain",
      "uploadedAt": "..."
    }
  ],
  "message": "Successfully uploaded 1 file(s)"
}
```

### 3. Test File Manager UI
Navigate to: http://localhost:3001/concepts/file-manager

Should show:
- Empty file list initially
- Upload button working
- Files appearing after upload
- Download/delete functionality

### 4. Check Database
You should see files being saved to the `files` table in Supabase with the user_id.
