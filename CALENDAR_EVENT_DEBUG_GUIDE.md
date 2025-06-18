# 🐛 **CALENDAR EVENT CREATION ERROR - DEBUGGING GUIDE**

## ❌ **Current Issue:**
Calendar event creation failing with HTTP error in the store's `createEvent` function.

## 🔍 **Debugging Steps Applied:**

### **1. Enhanced Error Logging:**
- ✅ **Updated calendar store** to capture detailed HTTP error responses
- ✅ **Enhanced API endpoint logging** for session verification and database operations
- ✅ **Added detailed Supabase error logging** with error codes and hints

### **2. Fixed Syntax Issues:**
- ✅ **Fixed missing newline** in calendar store
- ✅ **Fixed syntax error** in Calendar.tsx component

### **3. Created Debug Tools:**

#### **A. Test API Endpoint:**
`GET /api/test/calendar` - Tests authentication and database connection
```
Visit: http://localhost:3000/api/test/calendar
```

#### **B. Browser Debug Script:**
Run in browser console on calendar page:
```javascript
// Copy content from debug-calendar-events.js
```

## 🧪 **How to Debug:**

### **Step 1: Test Basic Connection**
1. Go to http://localhost:3000/api/test/calendar
2. Check if you get success response or error details

### **Step 2: Check Browser Console**
1. Go to http://localhost:3000/concepts/calendar
2. Open browser developer tools (F12)
3. Try creating an event
4. Look for detailed error logs in console

### **Step 3: Check Server Logs**
Monitor your Next.js terminal for detailed server-side logs including:
- Session verification details
- Supabase connection status
- Database operation results

## 🔍 **Potential Issues to Look For:**

### **Authentication Issues:**
- ❓ **No session** - User not logged in
- ❓ **Invalid session** - Session expired
- ❓ **Missing user ID** - Session missing user data

### **Database Issues:**
- ❓ **Connection failure** - Supabase credentials incorrect
- ❓ **RLS policy blocking** - Row Level Security preventing access
- ❓ **Table doesn't exist** - Migration not applied
- ❓ **Column mismatch** - Schema mismatch

### **Validation Issues:**
- ❓ **Date format** - Already fixed but check if still occurring
- ❓ **Required fields missing** - Title, start date, eventColor
- ❓ **Invalid UUID** - groupId format issues

## 📊 **Expected Logs (Success Case):**

### **Browser Console:**
```
🔄 Submitting event: {data: {...}, type: "NEW"}
🔄 Creating new calendar event...
✅ Event created successfully: uuid-here
```

### **Server Console:**
```
🔄 POST /api/calendar/events - Starting request
🔍 Session check in POST: {hasSession: true, userId: "uuid"}
✅ User authenticated: uuid
📥 Request body: {title: "...", start: "...", ...}
✅ Data validated successfully
💾 Inserting event into database: {...}
✅ Event created successfully: uuid
```

## 🚨 **Common Error Patterns:**

### **401 Unauthorized:**
```json
{"error": "Unauthorized"}
```
**Solution:** Check if user is logged in, verify session

### **500 Database Error:**
```json
{"error": "Failed to create event", "details": "..."}
```
**Solution:** Check Supabase connection, RLS policies, table schema

### **400 Validation Error:**
```json
{"error": "Invalid data format", "details": [...]}
```
**Solution:** Check data types and required fields

## ⚡ **Quick Fixes to Try:**

1. **Refresh Page** - Reload calendar page completely
2. **Re-login** - Sign out and sign back in
3. **Check Network Tab** - Look for failed requests in dev tools
4. **Clear Browser Cache** - Hard refresh (Ctrl+Shift+R)

## 📞 **Next Steps:**
1. Run the test endpoint: `/api/test/calendar`
2. Check the detailed logs in both browser and server console
3. Based on the specific error, we can apply targeted fixes

The enhanced logging should now provide much more detailed information about exactly where the failure is occurring! 🕵️‍♂️
