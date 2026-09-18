# IronBoard

A full-stack web app built for members of a local powerlifting gym. The core feature is a digital strength leaderboard that mirrors the gym's physical blackboards, ranking lifters by gender and weight class across the squat, bench, deadlift, OHP, and bodyweight movements. Supporting features include lift submissions with video proof and admin approval, a social feed, and member management tools for the gym owner.

Built with React, Node.js/Express, and PostgreSQL. Authentication uses JWT with an admin approval flow where new members start as `pending` and must be approved before they can log in. Lift submissions require two videos (scale + lift) uploaded directly to S3 via presigned URLs, reviewed by an admin before appearing on the leaderboard. Containerized with Docker, deployed to AWS EC2 via ECR, with a CI/CD pipeline in GitHub Actions that runs tests, builds images, and deploys on every push to `main`.

**Stack:** React · Node.js · Express · PostgreSQL · AWS (RDS, S3, EC2, ECR) · Docker · GitHub Actions
