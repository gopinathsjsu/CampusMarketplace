# Backend Fixes for Chat Functionality

## Summary
Fixed field mismatch between User model and populate calls in Chat/Product routes. Chat and Product routes were attempting to populate non-existent fields (`firstName`, `lastName`, `avatar`, `university`), causing incomplete user data in API responses.

## Changes

### 1. User Model (`models/User.ts`)
- Enabled virtuals in schema options (`toJSON: { virtuals: true }`)
- Added virtual fields for backward compatibility:
  - `firstName`: Derived from `userName` (everything before last space)
  - `lastName`: Derived from `userName` (last word)
  - `avatar`: Alias for `profilePicture`

**Why**: Allows routes to populate legacy field names while using actual model fields (`userName`, `profilePicture`).

### 2. Chat Routes (`routes/chat.ts`, `models/Chat.ts`)
Updated all `.populate()` calls from `firstName lastName avatar` to `userName profilePicture email`:
- GET /api/chat (line 27)
- GET /api/chat/:id (lines 57, 59)
- POST /api/chat/:id/messages (lines 152, 154)
- GET /api/chat/:id/messages (line 196)
- Chat.findOrCreateChat (lines 138, 148)

**Why**: Populate actual User model fields instead of non-existent ones.

### 3. Product Routes (`routes/products.ts`)
Updated all `.populate()` calls from `firstName lastName avatar university` to `userName profilePicture email schoolName`:
- GET /api/products (line 97)
- GET /api/products/:id (line 124)
- POST /api/products (line 193)
- PUT /api/products/:id (line 259)

**Why**: Match actual User model field names (`schoolName` not `university`).

### 4. Authorization Fix (`routes/products.ts`)
Removed `authorize('seller', 'admin')` middleware from POST /api/products (line 144).

**Why**: User model doesn't enforce roles and auth middleware doesn't check them. Any authenticated user can be a seller per marketplace design.

## Files Modified
- `backend/server/src/models/User.ts`
- `backend/server/src/models/Chat.ts`
- `backend/server/src/routes/chat.ts`
- `backend/server/src/routes/products.ts`

## Result
- Chat participant and product seller data now populates correctly
- API responses include complete user information
- Virtual fields maintain backward compatibility
- Authorization logic matches actual implementation
