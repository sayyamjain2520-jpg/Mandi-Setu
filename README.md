🌾 Mandi Setu
Smart Agricultural Procurement & Real-Time Queue Management

Mandi Setu is a digital procurement platform designed to reduce waiting time, improve transparency, and digitize the farmer journey at agricultural procurement centres.

It connects farmers, mandi operators, and administrators through digital slot booking, operator approval, QR-based gate verification, real-time queue management, quality inspection, weighment, procurement records, notifications, and payment tracking.

🚜 Problem

Farmers arriving at procurement centres can face:

Long and unpredictable waiting times

Limited visibility into queue position

Uncertainty about procurement schedules

Manual gate and verification processes

Fragmented procurement records

Limited visibility into payment status

Mandi Setu converts this physical workflow into a trackable digital process.

💡 Solution
Farmer
  ↓
Select Mandi
  ↓
Request Slot
  ↓
Operator Approval
  ↓
Digital Token + QR
  ↓
Live Queue
  ↓
QR Gate Verification
  ↓
Quality Inspection
  ↓
Weighment
  ↓
Procurement Record
  ↓
Payment Tracking

✨ Key Features
👨‍🌾 Farmer Portal

Farmer registration and authentication

Procurement-centre discovery

Slot booking

Crop and quantity selection

Digital booking number

QR-based digital pass

Live queue position

Estimated waiting time

Procurement status tracking

Payment tracking

Notifications

Multilingual interface

⚖️ Mandi Operator Dashboard

Assigned mandi dashboard

Pending booking requests

FIFO queue management

Call-next farmer workflow

QR gate scanner

Farmer and vehicle verification

Quality inspection

Weighment entry

Procurement recording

Queue stage management

Real-time updates

📊 Administrator Dashboard

Procurement-centre management

Commodity/MSP management

Procurement analytics

Queue monitoring

Payment status overview

Centre performance

Operational statistics

🏗️ Architecture
React + TypeScript + Vite
          │
          ├── Farmer Portal
          ├── Operator Portal
          └── Admin Portal
          │
          ▼
      Data Service
          │
     ┌────┴─────┐
     │          │
 Supabase    Local Store
     │          │
     ▼          ▼
PostgreSQL   localStorage
Auth
Realtime
RLS

🧰 Technology Stack
Frontend

React

TypeScript

Vite

React Router

Tailwind CSS

Lucide React

Leaflet

QRCode React

HTML5 QR Code

Backend / Data

Supabase

PostgreSQL

Supabase Auth

Row Level Security

Supabase Realtime

Deployment

Vercel

Progressive Web App support

📁 Project Structure
Mandi-Setu/
├── public/
├── scripts/
├── src/
│   ├── components/
│   ├── config/
│   ├── context/
│   ├── lib/
│   ├── modules/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── farmer/
│   │   └── operator/
│   ├── services/
│   │   └── mock/
│   └── types/
├── supabase/
│   └── migrations/
├── .env.example
├── package.json
├── vite.config.ts
└── README.md

🔐 Roles
Farmer

Can:

Create an account

Request procurement slots

View own bookings

View own queue status

Present QR pass

View procurement and payment status

Operator

Can:

Manage the assigned procurement centre

Review booking requests

Approve/reject bookings

Manage the queue

Call farmers

Verify QR passes

Perform quality inspection

Record weighment

Complete procurement

Administrator

Can:

Manage procurement centres

Manage commodities

Monitor operations

View analytics

Manage system configuration

🗄️ Database

The Supabase database contains entities for:

profiles

procurement_centres

commodities

time_slots

bookings

queue_entries

procurement_records

notifications

QC inspection records

Row Level Security should be enabled for all application tables.

⚙️ Environment Variables

Create .env.local:

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key


Never commit production secrets to Git.

🚀 Local Development
Requirements

Node.js

npm

A Supabase project for cloud mode

Install
git clone https://github.com/sayyamjain2520-jpg/Mandi-Setu.git
cd Mandi-Setu
npm install

Configure Supabase
cp .env.example .env.local


Add your Supabase URL and anonymous public key.

Start development server
npm run dev

Run lint
npm run lint

Production build
npm run build

Preview production build
npm run preview

🧪 Recommended Testing

Before production deployment, verify:

Farmer cannot access another farmer's bookings

Farmer cannot change their role

Operator can access only their assigned mandi

Operator cannot modify another mandi's queue

Anonymous users cannot insert queue entries

Anonymous users cannot create notifications

Booking capacity cannot be exceeded

Two operators cannot allocate the same token

Concurrent bookings cannot exceed slot capacity

QR passes cannot be reused incorrectly

Procurement records cannot be edited by farmers

Payment status cannot be forged from the client

📱 PWA

Mandi Setu includes Progressive Web App configuration for mobile-friendly installation and offline-friendly static assets.

Operational data should always display its synchronization state so users are not misled by stale information.

🌐 Languages

The interface is structured for multilingual use and currently includes:

English

हिन्दी

मराठी

ગુજરાતી

తెలుగు

தமிழ்

🛣️ Future Roadmap

SMS/WhatsApp notifications

Government payment-system integration

Digital procurement receipts

Audit trails

Advanced queue prediction

Dynamic slot allocation

Offline-first farmer workflow

Centre capacity forecasting

Anomaly detection for procurement

Additional Indian languages

Accessibility improvements for low-literacy users

🎯 Hackathon Demonstration

The recommended demonstration flow is:

Farmer Login
     ↓
Book Procurement Slot
     ↓
Operator Approves
     ↓
QR Digital Pass
     ↓
Live Queue
     ↓
Operator Calls Token
     ↓
QR Gate Verification
     ↓
Quality Inspection
     ↓
Weighment
     ↓
Procurement Record
     ↓
Payment Status

⚠️ Prototype Notice

This project is a prototype/demo implementation. Production deployment requires complete security review, database migration verification, transactional booking logic, real notification/payment integrations, monitoring, backups, privacy controls, and operational validation.

📄 License

Add the project's intended open-source or proprietary license here before public distribution.
