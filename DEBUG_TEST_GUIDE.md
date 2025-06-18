# 🧪 **DEBUG TEST CHECKLIST**

## 🔧 **What We Fixed:**

### **1. RLS Policies**
✅ Added policy for `authenticated` role (server client uses this)
✅ Kept policy for `anon` role (backup)
✅ Both policies allow UPSERT for trusted email domains

### **2. API Debugging**
✅ Added detailed logging to see which client type is used
✅ Added client role detection
✅ Enhanced error reporting for both GET and PUT

### **3. Frontend Profile Loading**
✅ Fixed response data structure access
✅ Added console logging for debugging
✅ Handles both { data: ... } and direct responses

---

## 🎯 **Expected Console Output (Success):**

### **For PUT /api/user/profile:**
```
🔄 PUT /api/user/profile - Starting request
🔑 Creating Supabase service client...
✅ Service role client created successfully
✅ Service role client test successful
📊 Client type selected: service_role
🔍 Client auth role: [role info]
✅ Profile updated successfully
```

### **For GET /api/user/profile:**
```
🔄 GET /api/user/profile - Starting request
👤 GET request for user: superadmin@projectmgt.com
🔑 GET: Creating Supabase service client...
✅ GET: Service role client created
📊 GET: Client type selected: service_role
📥 Profile API response: { success: true, data: { ... } }
✅ Profile loaded from API successfully
```

---

## 🚨 **If Still Failing, Check:**

1. **Service Role Key Issues:**
   ```
   ⚠️ Service role client failed: [error details]
   📊 Client type selected: authenticated
   ```

2. **RLS Policy Issues:**
   ```
   ❌ Database error: { code: '42501', message: 'new row violates...' }
   ```

3. **Profile Loading Issues:**
   ```
   ❌ Failed to load profile from API, using session data
   API Error: [error details]
   ```

---

## 🔍 **Current Database Policies:**
- `users_service_role_access` - Full access for service role
- `users_anon_api_access` - UPSERT access for anon role
- `users_authenticated_upsert` - UPSERT access for authenticated role

## 📊 **Supported Email Domains:**
- `@projectmgt.com` ✅
- `@gmail.com` ✅
- `@example.com` ✅

---

**🎯 Next Steps:**
1. Try updating your profile at http://localhost:3000/concepts/account/settings
2. Check browser console for detailed logs
3. If still failing, share the complete console output for further debugging
