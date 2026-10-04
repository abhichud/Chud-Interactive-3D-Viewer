# AI Usage 

Google Gemini was used responsibly as a technical mentor and coding helper while building this project.

## How AI Was Used
1. I asked AI to help me set up the basic 3D scene, load the `.glb` motorcycle files, and add `OrbitControls` so the user can rotate and zoom the bikes.
2. Instead of downloading large image files for the background, I used AI to generate the desert sand dunes, rocks, sunlight, and darker ground shadows directly in the code.
3. Fixing Bugs I Found While Testing:
   * Camera Lock Bug: When I clicked a subsystem button (like Engine), the camera moved in but wouldn't let me drag or zoom anymore. AI helped me add a simple on/off check (`isCameraAnimating`) so the camera stops moving automatically as soon as I click or scroll.
   * Wrong Parts Selected: The downloaded 3D models had generic part names like `Object_40` instead of `Engine` or `Wheel`, so the code guessed some parts wrong. AI helped me add a `Shift + Click` feature so I could click the wrong parts directly on the screen to fix them, copy those fixes from the browser console, and save them permanently into `script.js`.
   * Weird Reflections: The bikes initially looked too shiny and low-quality because of sky reflections, so I asked AI to turn off the reflections and keep the bike materials looking clean and solid.

## Verification & Personal Contribution
* I defined the multi-motorcycle showcase concept (BMW S1000RR and Honda CBR650R), the realistic golden-hour desert environment, the left-aligned vertical subsystem dock, the right-aligned thin magnification slider, and the Fallout CRT terminal aesthetic.
* I manually inspected and calibrated every 3D mesh across both motorcycles using the `Shift + Click` raycaster tool, extracted the override JSON via Chrome DevTools, and verified all interactions locally using VS Code Live Server.
* I cleaned up and manually simplified the HUD, stripped out all the clutteer.