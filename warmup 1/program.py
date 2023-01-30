import sys
from PIL import Image, ImageColor

with open(sys.argv[1]) as f:
    file = f.readlines()
    for line in file:
        if(line == "\n"): continue
        instructions = line.split()
        if(instructions[0] == "png"):
            image = Image.new("RGBA", (int(instructions[1]), int(instructions[2])), (0,0,0,0))
            filename = instructions[3]
        elif(instructions[0] == "xyrgb"):
            image.im.putpixel((int(instructions[1]), int(instructions[2])), (int(instructions[3]), int(instructions[4]), int(instructions[5])))
        elif(instructions[0] == "xyc"):
            image.im.putpixel((int(instructions[1]), int(instructions[2])), ImageColor.getcolor(instructions[3], "RGB"))

image.save(filename)
