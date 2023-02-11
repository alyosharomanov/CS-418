import sys
from PIL import Image
import numpy as np
import math
import itertools

width, height = None, None
image = None
filename = None
color = (255, 255, 255, 255)
vertices = []


def viewport_transformation(vertex):
    x, y, z, w = vertex[0], vertex[1], vertex[2], vertex[3]
    return (x / w + 1) * width / 2, (y / w + 1) * height / 2, z, w


def dda(start, end, d):  # from https://cs418.cs.illinois.edu/website/text/dda.html
    a, a_color, b, b_color = start[0], start[1], end[0], end[1]

    if a[d] == b[d]: return []
    if a[d] > b[d]: a, a_color, b, b_color = b, b_color, a, a_color

    delta, delta_color = tuple(np.subtract(b, a)), tuple(np.subtract(b_color, a_color))
    s, s_color = tuple(np.divide(delta, delta[d])), tuple(np.divide(delta_color, delta[d]))

    e = math.ceil(a[d]) - a[d]
    o, o_color = tuple(np.multiply(s, e)), tuple(np.multiply(s_color, e))
    p, p_color = tuple(np.add(a, o)), tuple(np.add(a_color, o_color))

    set = []
    while p[d] < b[d]:
        set.append((p, p_color))
        p, p_color = tuple(np.add(p, s)), tuple(np.add(p_color, s_color))

    return set


def draw(pixel):
    x, y, color = int(pixel[0][0]), int(pixel[0][1]), tuple(map(int, pixel[1]))

    if x >= width or x < 0 or y >= height or y < 0:
        return

    image.putpixel((x, y), color)


with open(sys.argv[1]) as f:
    file = f.readlines()
    for line in file:
        if line == '\n': continue
        line = line.split()
        print(line)

        if line[0] == 'png':
            width, height, filename = int(line[1]), int(line[2]), line[3]
            image = Image.new("RGBA", (width, height), (0, 0, 0, 0))

        elif line[0] == 'xyzw':
            v = (float(line[1]), float(line[2]), float(line[3]), float(line[4]))
            vertices.append((v, color))

        elif line[0] == 'rgb':
            color = (int(line[1]), int(line[2]), int(line[3]), 255)

        elif line[0] == 'tri':
            given_vertices = []
            for i in [int(line[1]), int(line[2]), int(line[3])]:
                index = i - 1
                if i <= 0: index = len(vertices) + i
                given_vertices.append((viewport_transformation(vertices[index][0]), vertices[index][1]))

            edge_pixels = []
            for i in itertools.combinations(given_vertices, 2):
                edge_pixels += dda(i[0], i[1], 1)

            edge_pixels_sorted = sorted(edge_pixels, key=lambda x: x[0][1])

            pixels = []
            for i in range(0, len(edge_pixels_sorted), 2):
                pixels += dda(edge_pixels_sorted[i], edge_pixels_sorted[i + 1], 0)

            for pixel in pixels: draw(pixel)

        elif line[0] == 'depth':
            sys.exit("Not yet implemented.")

        elif line[0] == 'sRGB':
            sys.exit("Not yet implemented.")

        elif line[0] == 'hyp':
            sys.exit("Not yet implemented.")

        elif line[0] == 'frustum':
            sys.exit("Not yet implemented.")

        elif line[0] == 'fsaa':
            sys.exit("Not yet implemented.")

        elif line[0] == 'cull':
            sys.exit("Not yet implemented.")

        elif line[0] == 'decals':
            sys.exit("Not yet implemented.")

        elif line[0] == 'clipplane':
            sys.exit("Not yet implemented.")

        elif line[0] == 'rgba':
            sys.exit("Not yet implemented.")

        elif line[0] == 'texcoord':
            sys.exit("Not yet implemented.")

        elif line[0] == 'texture':
            sys.exit("Not yet implemented.")

        elif line[0] == 'trit':
            sys.exit("Not yet implemented.")

        elif line[0] == 'point':
            sys.exit("Not yet implemented.")

        elif line[0] == 'billboard':
            sys.exit("Not yet implemented.")

        elif line[0] == 'line':
            sys.exit("Not yet implemented.")

        elif line[0] == 'wuline':
            sys.exit("Not yet implemented.")

        else: sys.exit("Instruction not recognized.")

image.save(filename)
