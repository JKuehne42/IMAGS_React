# IMAGS
# Visit the official site: https://vjmedia.wpi.edu/Private:IMAGS
# What is IMAGS?
IMAGS (Music-induced Analgesia Genome Study) is a research initiative aimed at addressing chronic pain through music. Initially developed by biomedical engineer Ava Mattimore and music technologist V.J. Manzo, the project seeks to identify which aspects of music are most effective in reducing chronic pain. The new IMAGS web application was developed by computer science majors Brendan Reilly and Spencer Trautz using React, with integration to Spotify through the Spotify API. The hardware for this project, assembled and troubleshooted by robotics engineering major Yan Acevedo, tracks Galvanic Skin Response (GSR) and Beats Per Minute (BPM), providing psychological data to analyze the patient's response to music. The IMAGS team includes specialists from the fields of music therapy, medicine, technology, and education, united by a mission to find non-opioid alternatives for chronic pain relief.
# How to Use the IMAGS Software
0. Open command window and type 'npm run dev' inside the IMAGS_React folder
1. Login to Spotify: Open the IMAGS web application and click on the "Login" button to sign in with your Spotify account.
2. Play Music: Once logged in, you can browse your playlists listed on the side panel. Click on any playlist to view its songs, and click the "Play" button to start playing a track. The "Play" button will change to a "Pause" button once the song begins.
3. Spotify Features: You can also control your music directly from your Spotify account. All Spotify features, like song selection, volume control, and more, will work as they normally do while the web app is running.
4. Connect to Arduino: Click on the "Connect to Arduino" button, then select your Arduino device from the list of available options. Once connected, the web app will begin tracking GSR and Pulse data.
5. Track Data: Hold the GSR sensor and/or the pulse sensor to start recording data. The system will continuously track and display the corresponding physiological data in real-time.
# Project Components
The IMAGS system consists of two main components:
- Software: A web application that allows researchers to track and analyze patients' music selections alongside physiological data, such as pain ratings.
- Hardware: A Galvanic Skin Response (GSR) sensor integrated with a Beats Per Minute (BPM) sensor to collect data on users' physiological responses while listening to music.
Together, these components help identify what types of music could potentially supplement or replace opioid pain relief.

Visit the IMAGS GitHub repository for more details on the software: https://github.com/EAMIRorg/IMAGS_React
# Galvanic Skin Response (GSR) Hardware
A separate repository for building the Arduino-based GSR sensor for use with the IMAGS platform is available here: https://github.com/EAMIRorg/GSR
# Known Issues and Fixes
- Serial Monitor not running: Unplug and re-plug the USB.
- Arduino not connecting:
  - Inside the Arduino IDE, go to Tools > Port and select the appropriate port.
  - Then go to Tools > Board and select Arduino WiFi 1010.
  - Install the firmware if needed.
- Inaccurate pulse sensor data: It is recommended to replace the Arduino pulse sensor with a specialized BPM sensor.
