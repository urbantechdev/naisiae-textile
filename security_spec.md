# Security Specification for Naisiae Textile

## Data Invariants
- A `product` must have a name, category, and price.
- Only users with the `admin` role in the `users` collection can Create, Update, or Delete products.
- `quotes` can be created by any authenticated user (anonymous or signed in).
- Admin users cannot change their own roles in the `users` collection.
- `analytics` events are strictly additions and should be protected from mass deletion.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempting to create a product with a user ID that isn't the current user's.
2. **Privilege Escalation**: A standard user attempting to update their role to `admin`.
3. **Shadow Field Injection**: Adding an `isVerified: true` field to a product document.
4. **Orphaned Quote**: Creating a quote with a non-existent service ID.
5. **Terminal State Bypass**: Attempting to update a quote that is already in 'closed' status.
6. **Mass Delete**: Attempting to delete the entire `products` collection.
7. **Resource Poisoning**: Injecting a 1MB string into the product description.
8. **Invalid ID**: Using a document ID with special characters like `#` or `?`.
9. **Timestamp Spoofing**: Manually setting `updatedAt` to a past date instead of `request.time`.
10. **Admin Self-Assign**: An unauthenticated user creating a doc in `/admins/` (if used).
11. **PII Leak**: A non-admin user attempting to read the entire `quotes` collection (which contains customer phones/emails).
12. **Price Manipulation**: Attempting to update a product price to a negative value.

## The Test Runner
A `firestore.rules.test.ts` will be implemented to verify these constraints.
