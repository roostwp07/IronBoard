# IronBoard

## Project Structure

```
IronBoard/
├── backend/                        
│   ├── src/                        # backend source code
│   │   ├── index.ts                
│   │   ├── app.ts                  
│   │   ├── config.ts               # reads/validates env config (JWT secret, etc)
│   │   ├── db.ts                   # shared Postgres connection pool + query() helper
│   │   ├── routes/
│   │   │   ├── auth.ts             # register, login, me endpoints
│   │   │   └── auth.test.ts        # tests for the auth endpoints
│   │   └── middleware/
│   │       ├── auth.ts             # requireAuth (JWT + active check), requireAdmin
│   │       └── auth.test.ts        # tests for the auth middleware
│   ├── schema.sql                  # SQL schema
│   ├── tsconfig.json               
│   ├── package.json                
│   ├── package-lock.json           
│   ├── .env                        
│   └── .gitignore
│
├── frontend/                       
│   └── src/                        # frontend source code
│
└── README.md
```
