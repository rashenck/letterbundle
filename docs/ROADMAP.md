# LetterBundle Roadmap

**Domain:** letterbundle.com

**Vision:** A platform for sharing collections of handwritten letters, preserving the charm of the originals while making them searchable and accessible.

---

## Future Features & TODOs

### Field Validation & Error Handling

- [ ] User registration validation (email format, password strength, username availability)
- [ ] Letter page form validation (required fields, character limits)
- [ ] File upload validation (file type, size limits)
- [ ] Graceful error handling with user-friendly messages throughout the app
- [ ] Inline validation feedback on forms
- [ ] Error boundary components for React

### Content Features

- [ ] Letter writer biography
  - [ ] Author profile with name, dates, relationship
  - [ ] Image upload for author photo
  - [ ] Link authors to letters they've written
  - [ ] Author gallery in bundle view

### Technical Improvements

- [ ] Image rendering optimization
  - [ ] Evaluate S3 serving pattern for letter images
  - [ ] Consider Next.js Image component with proper sizing
  - [ ] Lazy loading for letter page images
  - [ ] Responsive image variants (thumbnails, medium, full)

### UI/UX Improvements

- [ ] Edit Letter page layout improvements
  - [ ] Ensure letter images are scaled appropriately
  - [ ] Make transcription readable alongside image
  - [ ] Better responsive layout for desktop
- [ ] Collections page redesign
  - [ ] Make letters visible on bundle cards
  - [ ] Preview thumbnail grid for bundle contents
  - [ ] More attractive showcase flow
  - [ ] Featured image per bundle (first letter page)

### Security & Trust

- [ ] Virus scanning on upload (ClamAV or AWS-based)
- [ ] S3 bucket scanning (periodic or on-access)
- [ ] Content approval workflow for bundles (per-bundle approval before public)
- [ ] Admin moderation dashboard
- [ ] IP address capture and logging for users
- [ ] Rate limiting (API and uploads)

### Operational Controls

- [ ] Enable/disable new user registration
- [ ] Enable/disable user logins (maintenance mode)
- [ ] Site settings admin panel
- [ ] Status/metrics page (admin)
- [ ] Admin role system

### Polish & Branding

- [ ] Mascot design
- [ ] Cute 404 page ("lost letter" theme)
- [ ] Friendly error pages (500, 403, maintenance)
- [ ] Custom maintenance mode page

### Social Features (Future)

- [ ] Comments on public bundles
- [ ] Likes/bookmarks
- [ ] User following
- [ ] Activity feed

---

*Last updated: March 2026*
