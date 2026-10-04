# Interactive 3D Motorcycle SHowcase

Interactive 3D Product Showcase built for GDG USAR Web Development (Task 1)

## Core Requirements Covered
* Rotation and zoom controls powered by Three.js 'OrbitControls', with a synced magnification slider.
* Interactive options on the left to isolate subsystems like 'Engine','Transmission','Chassis' and 'Wheels'. Non selected parts sit at 12% opacity.
* Switch between two motorcycle models, BMW S1000RR 'bike1.glb' and Honda CBR650R 'bike2.glb' with scale normalization and ground alignment.
* Adapts cleanly across desktop and mobile views using CSS media queries and responsive WebGL resize handler.
* Switch between two themes, Amber and Green.

## Tech Stack
* HTML & CSS (Custom Properties, Flexbox/Grid, CRT Scanline Overlays, Responsive Media Queries)
* JavaScript
* Three.js (`WebGLRenderer`, `GLTFLoader`, `DRACOLoader`, `OrbitControls`, `Raycaster`, `Sky` Shader)