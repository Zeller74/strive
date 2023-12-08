# STRIVE

**Online study group platform**
![image](https://github.com/Zeller74/strive/assets/84753929/cf650b5c-993c-4617-877a-f89103c95d7f)
![image](https://github.com/Zeller74/strive/assets/84753929/c06dfc88-df5f-469d-812d-0910832b68e3)
STRIVE is a website intended to help students improve their school work by participating in study groups from anywhere.
STRIVE provides the ability to join a variety of different study groups, chat amongst peers, share resources, and schedule study events.


**Features:**
* Account creation/deletion
* Study group management (creating, joining, and leaving)
* Live chat messaging
* Resource uploading
* Scheduling events


**Note**
* Implemented using NextJS as framework
* Clerk used for user authentication
* Supabase used as database
* Vercel used for hosting


**How to Run:**
You can access the website at: https://strive-ruby.vercel.app/


**If you would like to run locally:**
Install the following node packages using `npm install`
├── @clerk/nextjs@4.25.2
├── @emotion/react@11.11.1
├── @emotion/styled@11.11.0
├── @mui/material@5.14.14
├── @supabase/realtime-js@2.8.1
├── @supabase/supabase-js@2.38.1
├── @tabler/icons-react@2.39.0
├── @types/react@18.2.34
├── autoprefixer@10.4.16
├── eslint-config-next@13.5.4
├── eslint@8.50.0
├── next@13.5.4
├── postcss@8.4.31
├── react-dom@18.2.0
├── react-icons@4.11.0
├── react-modal@3.16.1
├── react-pro-sidebar@0.7.1
├── react@18.2.0
└── tailwindcss@3.3.3

Then run the app with `npm run dev`


**If your screen looks like this:** 
![image](https://github.com/Zeller74/strive/assets/84753929/45f4cfb8-24d9-4c08-b09a-9dba5b71df5f)
Please go into the `/src/styles/globals.css` and change `@media (prefers-color-scheme: dark)` to `@media (prefers-color-scheme: light)`
