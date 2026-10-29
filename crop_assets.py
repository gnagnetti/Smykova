import subprocess

# Page 1 crops (1240x1754)
# Hero: approx 440x480 around (400, 280)
# Hero box in PDF is centered:
subprocess.run(["convert", "public/assets/training/caprese_page_1.png", "-crop", "340x400+450+300", "+repage", "public/assets/training/caprese_b_hero.png"])

# Colors on Page 1:
# The 3 boxes are horizontally distributed around y=1040..1300
subprocess.run(["convert", "public/assets/training/caprese_page_1.png", "-crop", "260x280+110+1030", "+repage", "public/assets/training/caprese_cammello.png"])
subprocess.run(["convert", "public/assets/training/caprese_page_1.png", "-crop", "260x280+455+1030", "+repage", "public/assets/training/caprese_nero.png"])
subprocess.run(["convert", "public/assets/training/caprese_page_1.png", "-crop", "260x280+800+1030", "+repage", "public/assets/training/caprese_panna.png"])

# Page 2 crops:
# Total Look Cammello: 4 items top row (approx y=300..520), 2 items bottom row (approx y=600..820)
subprocess.run(["convert", "public/assets/training/caprese_page_2.png", "-crop", "190x230+130+300", "+repage", "public/assets/training/look_cremina_cammello.png"])
subprocess.run(["convert", "public/assets/training/caprese_page_2.png", "-crop", "190x230+385+300", "+repage", "public/assets/training/look_caprese_cammello.png"])
subprocess.run(["convert", "public/assets/training/caprese_page_2.png", "-crop", "190x230+640+300", "+repage", "public/assets/training/look_fragolino.png"])
subprocess.run(["convert", "public/assets/training/caprese_page_2.png", "-crop", "190x230+895+300", "+repage", "public/assets/training/look_ulisside_cammello.png"])

subprocess.run(["convert", "public/assets/training/caprese_page_2.png", "-crop", "190x230+130+600", "+repage", "public/assets/training/look_iago.png"])
subprocess.run(["convert", "public/assets/training/caprese_page_2.png", "-crop", "190x230+385+600", "+repage", "public/assets/training/look_nagorno.png"])

# Total Look Nero on Page 2: approx y=1030..1260
subprocess.run(["convert", "public/assets/training/caprese_page_2.png", "-crop", "190x230+130+1030", "+repage", "public/assets/training/look_cremina_nero.png"])
subprocess.run(["convert", "public/assets/training/caprese_page_2.png", "-crop", "190x230+385+1030", "+repage", "public/assets/training/look_caprese_nero.png"])
subprocess.run(["convert", "public/assets/training/caprese_page_2.png", "-crop", "190x230+640+1030", "+repage", "public/assets/training/look_fabula.png"])
subprocess.run(["convert", "public/assets/training/caprese_page_2.png", "-crop", "190x230+895+1030", "+repage", "public/assets/training/look_ulisside_nero.png"])

# Neanide earrings on Page 3: approx top left y=100..320
subprocess.run(["convert", "public/assets/training/caprese_page_3.png", "-crop", "190x230+130+100", "+repage", "public/assets/training/look_neanide.png"])

print("Cropping complete.")
