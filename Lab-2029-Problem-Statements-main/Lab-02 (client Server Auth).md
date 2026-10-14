# Engineering Lab 02 — Frontend Engineering Lab

# ShopKart: Login → Home Flow

Frontend Lab

2 Hours

100 Marks

## The Story

The backend authentication APIs are already live. Your job is to build the customer-facing authentication UI so users can register, log in, and enter the ShopKart home page.

This lab focuses entirely on React + API integration.

## What You'll Build

Students must create these three pages:

![How to Improve the Cart & Checkout Page of Your eCommerce Store](https://images.openai.com/static-rsc-4/cAPbZEFjeEDLOUxSKY0YYxZx7DVDnU9VbfujREATMejDYx-mIaltdT4lYf-sa8rjkfXrSB0xRsf8cRwhQIxrFfQ_iJodI6e6rl3DERBXQs0aaLFDO6wLJTajJ7w1MccfBQWHselAKM_wAV3ipxXwzcFS6Po-PVswEdDqEHybizQ?purpose=inline)

Register Page

Collect customer details and create a new account using the backend API.

![103+ Sign in Components for React & Tailwind | 21st](https://images.openai.com/static-rsc-4/_w-1V6iKWMfs12513gl5h8s6ll6opbrp2oHtP1XVtGyOK1VrWuSIleyvphY1KSWBvwZszB0d80uCl_BnceM5kPN_cnrOGLqEioHxFgH6i5cJK7wxoYVwVqmR1ufhIesm7Mt2aLusA5tl7zSmeQff7P1ZD5zCKFtB9jJ808oHm2w?purpose=inline)

Login Page

Authenticate the customer and store the HttpOnly cookie automatically.

![10 E-commerce UI/UX Design Tips That Boost Conversion Rates in 2026 | by Dolly Borade Solanki | Feb, 2026 | Medium](https://images.openai.com/static-rsc-4/iPn_krWuOCjLqjyB07nrcjRut7p98TuPLgwqF3xRhnU79JPTh7y2Lo9L_rf8GTaYZJAX2uWxnGISCU3DZQL6UgIAoQb8UdT-uWwsNyuFNCpjOXhaA-ZN1_ErDvB46eD1VRPkqwX8O-3MSt06136Z788qbd5DGn7XCUyJib7AKm8?purpose=inline)

Home Page

Accessible only after successful login. Display the logged-in customer's information.

## Tech Stack

Allowed

* React

* React Router DOM

* Axios or Fetch API

* CSS / Tailwind CSS

Not Allowed

* Firebase

* Clerk

* Auth0

* Redux (not needed)

## Folder Structure

```
src/
│
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   └── Home.jsx
│
├── components/
│   └── Navbar.jsx
│
├── services/
│   └── api.js
│
├── App.jsx
└── main.jsx
```

## Task 1 — Registration Page (25 Marks)

### Route

`/register`

### UI Fields

* Full Name

* Email

* Password

* Phone Number

* Create Account Button

### API

`POST /customers/register`

### Requirements

* All fields are controlled components.

* Show validation errors.

* On success → Redirect to Login page.

### Example UI

![Building a Sleek Signup Form in Next.js with Tailwind CSS | by Sanjeevani Bhandari | Medium](https://images.openai.com/static-rsc-4/C3yCg3Kz5R11teGBgKrTP6gHWVqE-Qad2d5VLWR1L7Q3sf362CwZoinAQl2YfQBceC-ooIKvCYgBp9OuaaPqVS7uRL6fczMX1tzcIwpLr5k7S-Met9GX-ojBeysihoBFQvq9iep0oc_iJepI0zU0Dva161XEyZTxjDjUEY05s5A?purpose=inline)

![User registration form - Tailwind CSS Example](https://images.openai.com/static-rsc-4/myA3FkKaaLje19erzusvW1R-i7jZ2lci3Tw620NwUqPflBBSII6IRHJYhmIyt4UkHnuBu-aGOXIP0iK73c7RtGpNIDgr-NwnkvrOx4M_onh29sBOQPC1KoUXStcNaguIZlYCUDUhwk7cQMu72WO3oG013v6BS5A3MndQt5Vw9HE?purpose=inline)

![Registration Form with Validation & Success State - Tailwind CSS Example](https://images.openai.com/static-rsc-4/VK2WpzeueQL3N6X7LfQzZzU0ITzKTbpwJioQx0kLzjw5INafsk0j5mZVkYeN-9AcGXmjnhoudl9M8YltIb5p8hbogyPkUpbZqbMiJekdUQAF9Bl9l1lejtAtKO20FILiLe-vyPI5a0jJo3uSSQBr0oTbK5ooNsENHWKYbkkrhuk?purpose=inline)

4

## Task 2 — Login Page (30 Marks)

### Route

`/login`

### UI Fields

* Email

* Password

* Login Button

### API

`POST /customers/login`

### Requirements

* Send credentials with cookies.

* On success → Navigate to `/home`.

* Show "Invalid Credentials" on failure.

### Example UI

![Log in pages | Untitled UI](https://images.openai.com/static-rsc-4/c9Tg46z1i2p6fCVsTZWqCDvcok3Me-1D3mmsl0HlNfvqMM35u44PWEheWe-IvwOtGGuZsMASBmW4h32P8wEagxjvbaKmgerV3jAFozW13keteLfL-IoWoCQgfpbCmWtW2In184oYV66Ef_ksmfjyLDUSgHzSSAA-VQtbopdvfJc?purpose=inline)

![Claude Code / Codex / v0などの生成AIツールを活用し、要件定義、設計、コーディングまでAIと共創するフロントエンド開発の実践例を紹介します。 - SO Technologies 開発者ブログ](https://images.openai.com/static-rsc-4/Axthhy6BtwBOE30McrB97DKeUbcdpYgHdZhOoSHf8BztkZP5q1n801j7w85XcXG3xcAOmDLK8NX29RGQSY-IUfVk32I3gzffg6aIwVD15v8AzBJqoSqG2VUM1nr7EeV_tOatlD6ZP4yW1hngtF927RbJmFbFipd2sUu4ozllVls?purpose=inline)

![Ecommerce Automation: Automate Customer Group Assignment in Medusa](https://images.openai.com/static-rsc-4/hIf8qb2vOTbwOsA2A5-l27AicD72L0vfD0d4DpHVtP91ULM5GMt4Xfe8nz-bIIdL6vLGq2qK2RLy5LOEjsBJciJOR_Eo8DkbgWxgG7ws0WKh00pDiDVDpq8Sd-beeD8PoGuKCH6AzXtPSrckappyeX4f4pwuxiLomPn_wkxLap8?purpose=inline)

5

## Task 3 — Protected Home Page (30 Marks) (This can be done in the next Lab)

### Route

`/home`

This page should fetch the logged-in user.

### API

`GET /customers/me`

### Display

* Welcome message

* Customer name

* Email

* Phone number

Example:

![Xenith-eCommerce dashboard by Muhammad Shofiuddoula for Zeyox Studio on Dribbble](https://images.openai.com/static-rsc-4/1h0zDeme63XogFr44HwSnJDW8yeQ24E-qNpn7KeCehhUeJb-yKhOl8TbeqPVlSLj_zvnnfqMXeEju7T73PL7FxUK6bfINqOfdoDe8OYW04yj-mIzrDFj9EuURrhkoKBI5CDV1-XnKZNcISJPsoP6s42xNTbcfa3jcdad1WG6uiI?purpose=inline)

![MatDash Tailwind React Admin Dashboard Template | Codester](https://images.openai.com/static-rsc-4/TCyYdoaGiuaxt9TI8eD9Ia1KxG3ESpbXuiTPjcubfH3ZhbW5QLgEEBOf-9SPbo15gA3iR9AaO4T0sl4RpnT8sZcSRxMgcqbfHImywfsn6I9KqMGAwBVwVLDbSEk-SHs2s2tvMWYMYsGACQtTBDTMc6G3GKxWuQF-LFmKhxBjFGU?purpose=inline)

![User Profile Blocks for Shadcn UI - Shadcnblocks](https://images.openai.com/static-rsc-4/Omv1sCP673GhE0NkIO6Koxi0fIPFkkmq92Ujxj49IsIRj-np-Uh1ttiA7BhKzZbfwPNkk5Hp1XRPt8RCD12J0Qj59COupjdLcSVEQgXTUq8Relaa6C_iBWMOldei9RGors7Ef3_RQNCBc4wWh6eyl6EUteft1EpIf0AezUJq0Yk?purpose=inline)

### If Not Logged In

Automatically redirect to `/login`.

## Task 4 — Logout (15 Marks)

Add a logout button in the navbar.

### API

`POST /customers/logout`

### Expected Flow

1. User clicks Logout

2. Cookie gets cleared

3. Redirect to Login page

# Routes Summary

|
Route

|

Page

|
| --- | --- |
|

`/register`

|

Registration

|
|

`/login`

|

Login

|
|

`/home`

|

Protected Home

|

# Acceptance Criteria

* Register page created

* Login page created

* React Router configured

* API integration works

* Cookies sent correctly

* Home protected using `/customers/me`

* Logout redirects to login

* Clean responsive UI

# TA Evaluation Rubric

|
Category

|

Marks

|
| --- | --- |
|

Registration UI + API

|

25

|
|

Login UI + API

|

25

|
|

Protected Home

|

20

|
|

Logout

|

10

|
|

Routing

|

10

|
|

UI & Code Quality

|

10

|
|

Total

|

100

|

# TA Viva Questions

1. Why do we use `withCredentials: true`?

2. Why can't JavaScript read an HttpOnly cookie?

3. Why is `/home` called a protected route?

4. Why do we fetch `/customers/me` instead of storing the user manually?

5. What is the difference between authentication and authorization?

## Submission

Submit a React project containing:

* Register page

* Login page

* Protected Home page (This can be done in the next Lab)

* Working API integration with your Lab 01 backend

* Proper navigation using React Router
