# Project Title:
  Turrf-Zone Booking and Maintenance.

# Description:
  An online turf-slot booking system that lets users reserve their play time without needing to visit the turf physically. 
Players can easily view their bookings, while admins can monitor monthly/yearly booking trends, mark slots as under maintenance (to prevent bookings),
and even cancel booked slots when needed.

# Tech Stack:
  - Frontend: React + TypeScript
  - Backend: Node.js and .NET 8
  - Database: Postgres sql.

# Installation:
  - git clone https://github.com/Vimal-P-3692/Final-Turrf.git
  - cd Final-Turrf

  # Frontend 
  - cd Frontend
  - npm install  # to install common packages for both admin and the user.

  # Frontend for user.
  - cd Frontend-User
  - npm install  # to install the packages on the user side.
  - npm run dev  # to run the frontend-user.

  # Frontend for admin.
  - cd ../Frontend-admin  # to install the packages on the admin side.
  - npm install  # to install the packages on the admin side.
  - npm run dev  # to run the frontend-admin.

  # Backend for admin.
  - cd Backend-admin/turfmanagement
  - dotnet run  # to run the backend for the admin.

  # Backend for user.
  - cd ../../Backend-user/turfmanagement
  - dotnet run  # to run the backend for the user.

  # Otp service
   - cd OTP
   - npm install  # to install the packages
   - node server.js  # to start the message service.
  
  
# truf_world
