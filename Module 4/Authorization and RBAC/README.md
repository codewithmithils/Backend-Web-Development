# Authorization & RBAC

## Run locally

```bash
npm install
cp .env.example .env
npm test
npm start
```

## Authorization behavior

- `requireRole(...allowedRoles)` responds with **401 UNAUTHENTICATED** when `req.user` is missing and **403 FORBIDDEN** when the verified user's role is not permitted.
- `DELETE /users/:id` is administrator-only.
- `POST /posts/:id/hide` is restricted to moderators and administrators.
- `PATCH /posts/:id` and `DELETE /posts/:id` are restricted to the post owner or a moderator/administrator.
- Missing posts return **404 NOT_FOUND** before ownership is checked.

## Why test case #2 returns 403

The test signs in as member B and attempts to edit member A's post. In `src/routes/posts.js`, the PATCH handler first checks that the post exists, then calls `canManagePost(req.user, post)`. The helper allows the matching `authorId` or a moderator/admin role. Member B is neither, so the handler returns **403 FORBIDDEN** before changing the post.

Roles are read only from `req.user.role`, which is populated by the existing authentication middleware — never from client input.
