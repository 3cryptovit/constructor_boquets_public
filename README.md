🌸 Boquet Shop — Web-based Bouquet Builder

Boquet Shop is a modern web application for online flower bouquet creation and sales, allowing users to build the perfect bouquet for any occasion with an intuitive constructor, convenient catalog, and a cart with order processing.
Project Features:

Authentication & Registration
- User registration.
- Login using JWT tokens.
- Cart and orders linked to each user.

Bouquet Constructor
- Create and save custom bouquets.
- Visual selection of flowers and packaging.
- Drag-and-drop interface for bouquet components.

Cart & Orders
- Easy-to-use cart with saved items.
- Checkout with order saved to the database.

Catalog
- A ready-to-use bouquet catalog.
- Add to cart directly from catalog.
- Modern animations and hover effects.

---

Technologies Used:

Frontend:
- React (Vite)
- React Router DOM
- Zustand (state management)
- Modern CSS animations and styling

Backend:
- Node.js
- Express.js
- PostgreSQL
- JWT-based authentication

Testing:
- Jest
- React Testing Library

---

Running the Project:

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Backend:
```bash
cd backend
npm install
npm start
```

Project: `boquet_shop/`
```
boquet_shop/
├── backend/                    # Server-side (Node.js + Express + PostgreSQL)
│   ├── server.js              # Main entry point for the Express server
│   ├── .env                   # Environment variables (DB credentials, PORT, etc.)
│   ├── database/
│   │   ├── db.js              # PostgreSQL connection setup
│   │   ├── queries.js         # SQL queries for bouquets, flowers, etc.
│   │   └── migrations/
│   │       ├── init.sql       # SQL script to create all tables
│   │       └── pg-migrate-config.js # Migration configuration
│   ├── controllers/           # (optional) Separated route logic per module
│   └── package.json           # Backend dependencies and scripts
│
├── frontend/                  # Client-side (React + Vite)
│   ├── public/
│   │   └── assets/            # Static images (flowers, bouquets, etc.)
│   ├── src/
│   │   ├── assets/            # Imported images and styles
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Header.jsx     # Navigation bar with login/logout
│   │   │   ├── Cart.jsx       # User's shopping cart
│   │   │   ├── Catalog.jsx    # Bouquet catalog
│   │   │   ├── Login.jsx      # Login form
│   │   │   ├── Register.jsx   # Registration form
│   │   │   ├── Contacts.jsx   # Contact information
│   │   │   └── About.jsx      # About the project page
│   │   ├── pages/
│   │   │   └── Constructor.jsx# Bouquet constructor page
│   │   ├── store/
│   │   │   └── cartStore.js   # Zustand state management (e.g. cart state)
│   │   ├── utils/             # Utility functions and API helpers
│   │   ├── App.jsx            # Main application component with routing
│   │   ├── main.jsx           # Entry point for React
│   │   └── index.css          # Global styles
│   └── package.json           # Frontend dependencies and scripts
│
├── infrastructure/            # DevOps and configuration files
│   ├── docker-compose.yml     # Docker setup for backend + PostgreSQL
│   └── .gitignore             # Git ignore rules
│
├── mobile/                    # (planned) Mobile version
│   └── (React Native / Flutter in the future)
│
├── services/                  # (planned) Microservices (e.g. bouquet recommender AI)
│
├── tests/                     # Unit and end-to-end tests
│   ├── Register.test.js       # Tests for registration logic
│   └── Constructor.test.js    # Tests for bouquet builder
│
└── README.md                  # Project documentation


---

What each folder does:
| Folder | Purpose |
| `backend/database` | Manages DB connections, migrations, and SQL logic |
| `frontend/store` | Zustand-based state management (e.g. cart content) |
| `frontend/pages` | React pages used for routing (`/constructor`, etc.) |
| `frontend/components` | Reusable UI elements like login, header, catalog |
| `services/` | Future microservices (e.g. neural bouquet recommender) |
| `infrastructure/` | Docker config, Git rules, deployment-related files |
| `mobile/` | Placeholder for future mobile app development |


Roadmap (Planned Features):
- Mobile version of the application.
- Advanced analytics on orders and user preferences.

---


