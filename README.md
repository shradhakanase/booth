# Booth Analysis & Election Intelligence Platform

A high-performance **Form 20 Booth Analysis & Election Data Analytics Platform** built with **Next.js (App Router, JavaScript Only)**, **MongoDB + Mongoose**, and **Tailwind CSS**.

---

## 🌟 Key Features

1. **Massive Scale Ingestion**:
   - Ingests and processes **90,000+ Booth Records** across **215+ Form 20 files** and **38+ Districts**.
   - Normalized candidate votes, NOTA, valid votes, rejected votes, tendered votes, and winning margins.

2. **Supported Districts**:
   - Agra, Aligarh, Ambedkar Nagar, Amethi, Azamgarh, Balrampur, Banda, Barabanki, Bareilly, Bhadohi, Budaun, Chandauli, Fatehpur, Gautam Buddha Nagar, Ghaziabad, Gorakhpur, Jaunpur, Jhansi, Kannauj, Kanpur Nagar, Kushinagar, Lucknow, Mahoba, Mau, Pratapgarh, Prayagraj, Sambhal, Shrawasti, Sitapur, Varanasi, and all future districts.

3. **Multi-Format Upload Engine**:
   - Supports **`.xlsx`**, **`.csv`**, and **`.pdf`** Form 20 spreadsheets.
   - SHA-256 duplicate file hashing to prevent duplicate records.
   - Automatic constituency and candidate column detection.

4. **Configurable Booth Classification**:
   - **Strong Booth**: Winner Vote Share $\ge 50\%$ (Configurable)
   - **Medium Booth**: Winner Vote Share $30\% - 49.9\%$
   - **Weak Booth**: Winner Vote Share $< 30\%$
   - Instant live reclassification across all 90,000+ booths via the Settings page.

5. **Deep Exploration & Analytics**:
   - **Overview Dashboard**: KPI cards, victory margin distributions, closest contests, and landslide victory tables.
   - **District Directory**: Comparative stats, turnout rates, candidate shares, and district deep-dive modal.
   - **Constituency Analysis**: Winners, runner-ups, vote shares, and margin breakdowns.
   - **Candidate Performance**: Booth victory rates, average votes, highest/lowest performing polling stations.
   - **Booth Explorer**: Server-side paginated table with cascading filter (District $\to$ AC $\to$ Candidate $\to$ Category), searchable by booth number or station name.
   - **Source Files Registry**: Status tracking, total booths extracted, and cascade deletion.

---

## 🏗️ Architecture & Technology Stack

- **Framework**: Next.js 14 (App Router, JavaScript `.js` only)
- **Database**: MongoDB with Mongoose ORM
- **Styling**: Tailwind CSS with custom glassmorphism tokens
- **Data Visualizations**: Recharts (Responsive bar, area, donut, margin spectrum)
- **Parsing Libraries**: SheetJS (`xlsx`), `papaparse`, `pdf-parse`

---

## 🗄️ MongoDB Collections & Schemas

- **`districts`**: District name, total files, total ACs, total booths, total votes, leading candidate & party, average turnout.
- **`constituencies`**: Assembly constituency name, number, district, total booths, total votes, candidate totals, winner, runner-up, margin.
- **`booths`**: Booth number, polling station name, district, assembly constituency, candidate vote array with vote shares, winner, runner-up, margin, NOTA, performance category (`strong`|`medium`|`weak`), source file reference.
- **`candidates`**: Candidate name, party, district, assembly constituency, total votes polled, vote share, booths won, booths lost, best booth, lowest booth.
- **`sourcefiles`**: File name, district, file type, file hash, rows, booths extracted, status, error logs.
- **`settings`**: Dynamic system configuration (e.g. classification thresholds).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env.local`)
```env
MONGODB_URI=mongodb://127.0.0.1:27017/booth_analysis
PORT=3008
```

### 3. Seed Database from Form 20 Conversion Files
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3008](http://localhost:3008) in your browser.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/analytics/overview` | `GET` | Overall KPI metrics, top districts, and performance distribution |
| `/api/analytics/margins` | `GET` | Margin distribution brackets, closest contests, and largest victory margins |
| `/api/analytics/district` | `GET` | District-level comparisons and party vote shares |
| `/api/analytics/constituency` | `GET` | Constituency-level breakdown and candidate totals |
| `/api/analytics/booth` | `GET` | Booth distribution and performance metrics |
| `/api/analytics/candidate` | `GET` | Candidate comparison and booth victory shares |
| `/api/districts` | `GET` | List of all districts with sorting and search |
| `/api/districts/[district]` | `GET` | Single district detail with AC breakdown |
| `/api/constituencies` | `GET` | List of constituencies filterable by district |
| `/api/constituencies/[id]` | `GET` | Constituency detail and candidate breakdown |
| `/api/booths` | `GET` | Server-side paginated booths with cascading filters |
| `/api/candidates` | `GET` | List of candidates with victory rates and best booths |
| `/api/files` | `GET` | List of uploaded Form 20 conversion files |
| `/api/files/[id]` | `GET`, `DELETE` | File details and cascade file deletion |
| `/api/upload` | `POST` | Multi-format file uploader with live extraction & validation |
| `/api/settings` | `GET`, `PUT` | Configure classification thresholds & trigger live database reclassification |
