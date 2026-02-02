# Safari Authentication Fix - Testing Guide

## What Was Fixed

The issue on Safari was that after page reload, the access token stored in-memory was lost (normal behavior), but the refresh token wasn't being restored before API calls happened. This caused 401 errors.

**Solution Implemented**:
1. **Request Queue**: Added `isInitializing` flag and `initializePromise` to prevent concurrent initialization
2. **Request Interceptor Wait**: All requests now wait for auth initialization to complete before sending
3. **Robust Response Handling**: Both old (`token:`) and new (`accessToken:`) response formats supported
4. **Improved App Initialization**: App.tsx now checks if auth initialization succeeded before fetching user profile

## Testing Steps

### Step 1: Clear Old Data (CRITICAL - Remove Stale Tokens)
1. **On Safari**:
   - Go to Settings → Privacy → Manage Website Data
   - Search for "medicare.uz" and "api.medicare.uz"
   - Delete all stored data for these domains
2. **Alternative (DevTools)**:
   - Open Web Inspector (Develop menu → Show Web Inspector)
   - Go to Storage → LocalStorage
   - Delete `refreshToken` key if it exists
   - Cookies → Delete refreshToken

### Step 2: Fresh Login Test
1. Navigate to `https://medicare.uz/en/account` (or your locale)
2. You should be redirected to login page
3. **Sign up with a new test account**:
   - Name: `Safari Test User`
   - Email: `safari-test-TIMESTAMP@test.com` (use unique timestamp)
   - Password: `Test123!@#`
4. After signup, you should be redirected to account page
5. **Verify in Safari DevTools**:
   - Open Web Inspector → Storage → LocalStorage
   - Should see `refreshToken` key with a value (UUID format)
   - Should see `Authorization` header in Network tab with `Bearer {accessToken}`

### Step 3: Page Reload Test (CRITICAL TEST)
1. **While still logged in, refresh the page** (Cmd+R or Cmd+Shift+R for hard refresh)
2. Watch the Network tab and Console for logs:
   - Look for `[AUTH] Initializing from refresh token...`
   - Should see `[AUTH] ✅ Re-authenticated from refresh token`
   - Then `[APP] Auth initialization result: true`
   - Then `GET /api/user/me` should return **200** (not 401)
3. **Expected Result**: Page loads, user stays logged in, account page shows user data

### Step 4: Multiple Page Reloads
1. Reload 3-5 times rapidly
2. Each time should show the `[AUTH]` initialization flow in console
3. Should never see 401 errors
4. Account page should always display user profile correctly

### Step 5: Browser Tab Switching Test
1. Log in on Safari
2. Open another tab and navigate to `medicare.uz`
3. Should automatically show as logged in (same refresh token in localStorage)
4. Close one tab, refresh the other
5. Should still be logged in

### Step 6: Logout & Login Again
1. Click Logout on account page
2. Should see `[POST] /api/auth/logout`
3. Verify `refreshToken` is removed from localStorage
4. Log back in with same account
5. Should get fresh tokens
6. Reload page, should still be logged in

### Step 7: Cross-Domain Cookie Fallback (Chrome/Firefox)
On Chrome or Firefox (for comparison):
1. Login
2. Check Network tab - should see `Set-Cookie: refreshToken=...`
3. Refresh page
4. Should still work even if localStorage doesn't work (cookie fallback)

## Expected Console Logs (Safari)

**On Initial Load**:
```
[APP] Initializing auth...
[AUTH] Initializing from refresh token stored in localStorage
[AUTH] ✅ Re-authenticated from refresh token
[APP] Auth initialization result: true
[APP] ✅ User profile loaded
```

**On Page Reload After Login**:
```
[APP] Initializing auth...
[AUTH] Initializing from refresh token stored in localStorage
[AUTH] ✅ Re-authenticated from refresh token
[APP] Auth initialization result: true
```

**On First API Request During Initialization**:
```
[INTERCEPTOR] Token refreshed successfully
[INTERCEPTOR] ✅ Token refreshed successfully
GET /api/user/me 200
```

## Troubleshooting

### Issue: Still Getting 401 After Reload

**Check 1: Is localStorage working?**
- Open Safari DevTools → Storage → LocalStorage
- After login, should see `refreshToken` key
- If not showing, Safari privacy settings might be blocking it

**Check 2: Is token restoration happening?**
- Check Console tab for `[AUTH]` logs
- If not showing, `initializeAuth()` not being called
- Check `src/App.tsx` useEffect

**Check 3: Is old stale token causing jwt malformed?**
- Clear localStorage completely (Step 1)
- Login fresh and test again

### Issue: Works on Chrome but not Safari

**Most Likely Cause**: Apple ITP (Intelligent Tracking Prevention) blocking cookies
- Solution: Tokens stored in localStorage (which you're now doing)
- Verify refreshToken appears in localStorage after login

### Issue: Login successful but immediate logout

**Possible Causes**:
1. Refresh token stored but immediately deleted by Safari privacy settings
2. Response structure mismatch - check backend returning correct fields

**Test**:
- Monitor Network tab during login
- Verify response contains `{ accessToken, refreshToken, user }`
- Check localStorage shows refreshToken after login

## Verification Checklist

- [ ] Step 1: Old data cleared (no stale tokens in localStorage)
- [ ] Step 2: Fresh login works, refreshToken stored in localStorage
- [ ] Step 3: Page reload shows [AUTH] logs and stays logged in
- [ ] Step 4: Multiple reloads work without 401 errors
- [ ] Step 5: User stays logged in when switching tabs
- [ ] Step 6: Logout clears token, fresh login works
- [ ] Step 7: Chrome/Firefox also work (cookie fallback)

## If Still Not Working

1. **Clear everything and try again**:
   ```javascript
   // In Safari Console
   localStorage.clear()
   sessionStorage.clear()
   // Then Settings → Privacy → Manage Website Data → Remove for medicare.uz
   ```

2. **Check Network Tab During Initialization**:
   - Look for `POST /api/auth/refresh` request
   - Check response body contains `{ accessToken, refreshToken, ... }`
   - If missing, backend might not be updated

3. **Check that new code deployed**:
   - Frontend: Should show changes from Netlify build
   - Backend: Restart Railway app or check git commit

4. **Monitor Backend Logs**:
   - Check Railway logs for `[REFRESH]` messages
   - Should show tokens being validated
   - Any database errors?

## Success Indicators

✅ **You'll know it's working when**:
1. Safari refresh page maintains login without 401
2. Console shows `[AUTH] ✅ Re-authenticated from refresh token`
3. No 401 errors after page reload
4. Multiple tab switching preserves login state
5. Logout actually clears tokens
6. Fresh login/logout cycles work consistently

