import sys
from PIL import Image
import numpy as np
import math
import itertools

width, height = None, None
image = None
filename = None
given_color = (255., 255., 255., 255.)
vertices = []

has_depth, has_sRGB, has_hyp, has_fsaa, has_cull = False, False, False, False, False
depth_buffer = None


class Point:
    def __init__(self, coordinate, color):
        self.x = coordinate[0]
        self.y = coordinate[1]
        self.z = coordinate[2]
        self.w = coordinate[3]
        self.r = color[0]
        self.g = color[1]
        self.b = color[2]
        self.a = color[3]

    def coordinates(self):
        return self.x, self.y, self.z, self.w

    def color(self):
        return self.r, self.g, self.b, self.a

    def __add__(self, other):
        return Point((self.x + other.x, self.y + other.y, self.z + other.z, self.w + other.w), (self.r + other.r, self.g + other.g, self.b + other.b, self.a + other.a))

    def __sub__(self, other):
        return Point((self.x - other.x, self.y - other.y, self.z - other.z, self.w - other.w), (self.r - other.r, self.g - other.g, self.b - other.b, self.a - other.a))

    def __mul__(self, other):
        return Point((self.x * other, self.y * other, self.z * other, self.w * other), (self.r * other, self.g * other, self.b * other, self.a * other))

    def __truediv__(self, other):
        return Point((self.x / other, self.y / other, self.z / other, self.w / other), (self.r / other, self.g / other, self.b / other, self.a / other))

    def viewport_transformation(self):
        return Point(((self.x / self.w + 1) * width / 2, (self.y / self.w + 1) * height / 2, self.z, self.w), (self.r, self.g, self.b, self.a))

    def hyp(self):
        return Point((self.x, self.y, self.z / self.w, 1 / self.w), (self.r / self.w, self.g / self.w, self.b / self.w, self.a / self.w))

    def to_lin(self):
        return Point(self.coordinates(), (srgb_to_lin(self.r), srgb_to_lin(self.g), srgb_to_lin(self.b), self.a))

    def to_srgb(self):
        return Point(self.coordinates(), (lin_to_srgb(self.r), lin_to_srgb(self.g), lin_to_srgb(self.b), self.a))

    def draw(self):
        if has_hyp: self = self.hyp()
        if has_sRGB and not has_fsaa: self = self.to_srgb()

        x_int, y_int, z_int, w_int = int(self.x), int(self.y), self.z, self.w

        if x_int >= width or x_int < 0 or y_int >= height or y_int < 0: return
        if has_depth:
            if depth_buffer[x_int, y_int] >= z_int / w_int >= -1:
                depth_buffer[x_int, y_int] = z_int / w_int
            else:
                return
        image.putpixel((x_int, y_int), (int(self.r), int(self.g), int(self.b), int(self.a)))


def ddax(a, b):  # from https://cs418.cs.illinois.edu/website/text/dda.html
    if a.x == b.x: return []
    if a.x > b.x: a, b = b, a

    delta = b - a
    s = delta / delta.x

    e = math.ceil(a.x) - a.x
    o = s * e
    p = a + o

    set = []
    while p.x < b.x:
        set.append(p)
        p = p + s

    return set


def dday(a, b):  # from https://cs418.cs.illinois.edu/website/text/dda.html
    if a.y == b.y: return []
    if a.y > b.y: a, b = b, a

    delta = b - a
    s = delta / delta.y

    e = math.ceil(a.y) - a.y
    o = s * e
    p = a + o

    set = []
    while p.y < b.y:
        set.append(p)
        p = p + s

    return set


def srgb_to_lin(color):  # from http://www.cyril-richon.com/blog/2019/1/23/python-srgb-to-linear-linear-to-srgb
    s = color / 255
    if s <= 0.0404482362771082:
        lin = s / 12.92
    else:
        lin = pow(((s + 0.055) / 1.055), 2.4)
    return lin * 255


def lin_to_srgb(color):  # from http://www.cyril-richon.com/blog/2019/1/23/python-srgb-to-linear-linear-to-srgb
    lin = color / 255
    if lin > 0.0031308:
        s = 1.055 * (pow(lin, (1.0 / 2.4))) - 0.055
    else:
        s = 12.92 * lin
    return s * 255


def orientation(p1, p2, p3):  # from https://iq.opengenus.org/orientation-of-three-ordered-points/
    val = (float(p2.y - p1.y) * (p3.x - p2.x)) - (float(p2.x - p1.x) * (p3.y - p2.y))

    if val > 0:
        return 1  # Clockwise orientation
    elif val < 0:
        return 2  # Anti-clockwise orientation
    else:
        return 0  # Collinear orientation


def get_vertex(i):
    if i <= 0: return (vertices[len(vertices) + i]).viewport_transformation()
    return (vertices[i - 1]).viewport_transformation()


def generate_pixels_between(points):
    edge_pixels = []

    for i in itertools.combinations(points, 2):
        edge_pixels += dday(i[0], i[1])

    edge_pixels.sort(key=lambda i: i.y)

    pixels = []
    for i in range(0, len(edge_pixels), 2):
        pixels += ddax(edge_pixels[i], edge_pixels[i + 1])

    return pixels


with open(sys.argv[1]) as f:
    file = f.readlines()
    for line in file:
        if line == '\n': continue
        line = line.split()
        print(line)

        if line[0] == 'png':  # required
            width, height, filename = int(line[1]), int(line[2]), line[3]
            image = Image.new("RGBA", (width, height), (0, 0, 0, 0))

        elif line[0] == 'xyzw':  # required
            vertex = Point((float(line[1]), float(line[2]), float(line[3]), float(line[4])), given_color)
            if has_sRGB: vertex = vertex.to_lin()
            vertices.append(vertex)

        elif line[0] == 'rgb':  # required
            given_color = (float(line[1]), float(line[2]), float(line[3]), 255)

        elif line[0] == 'tri':  # required
            given_vertices = []
            for i in [int(line[1]), int(line[2]), int(line[3])]:
                vertex = get_vertex(i)
                if has_hyp: vertex = vertex.hyp()
                given_vertices.append(vertex)

            if has_cull and orientation(given_vertices[0], given_vertices[1], given_vertices[2]) != 1:
                continue

            for pixel in generate_pixels_between(given_vertices): pixel.draw()

        elif line[0] == 'depth':  # 15 points
            has_depth = True
            depth_buffer = np.ones([width, height])

        elif line[0] == 'sRGB':  # 5 points
            has_sRGB = True

        elif line[0] == 'hyp':  # 10 points
            has_hyp = True

        elif line[0] == 'frustum':
            sys.exit("Not yet implemented.")

        elif line[0] == 'fsaa':  # 10 points
            has_fsaa = True
            fsaa_level = int(line[1])
            width *= fsaa_level
            height *= fsaa_level
            image = Image.new('RGBA', (width, height), (0, 0, 0, 0))

        elif line[0] == 'cull':  # 5 points
            has_cull = True

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

        elif line[0] == 'point':  # 5 points
            pointsize, veretx = float(line[1]), get_vertex(int(line[2]))

            offset = pointsize / 2
            a = Point((veretx.x + offset, veretx.y + offset, veretx.z, veretx.w), vertex.color())
            b = Point((veretx.x + offset, veretx.y - offset, veretx.z, veretx.w), vertex.color())
            c = Point((veretx.x - offset, veretx.y + offset, veretx.z, veretx.w), vertex.color())
            d = Point((veretx.x - offset, veretx.y - offset, veretx.z, veretx.w), vertex.color())

            for pixel in generate_pixels_between([a, b, c]): pixel.draw()
            for pixel in generate_pixels_between([b, c, d]): pixel.draw()

        elif line[0] == 'billboard':
            sys.exit("Not yet implemented.")

        elif line[0] == 'line':
            sys.exit("Not yet implemented.")

        elif line[0] == 'wuline':
            sys.exit("Not yet implemented.")

        else: sys.exit("Instruction not recognized.")

if has_fsaa:
    output = np.zeros([int(height / fsaa_level), int(width / fsaa_level), 4])
    for y in range(len(output)):
        for x in range(len(output[y])):
            color_total = [0, 0, 0, 0]
            for i in range(fsaa_level):
                for j in range(fsaa_level):
                    color = np.array(image)[y * fsaa_level + i, x * fsaa_level + j]

                    for k in range(0, 3):
                        color_total[k] += color[k] * (color[3] / 255.)
                    color_total[3] += color[3]

            weight = color_total[3] / 255.
            if weight != 0:
                for k in range(0, 3):
                    color_total[k] /= weight

            color_total[3] /= fsaa_level * fsaa_level

            for i in range(0, 3):
                color_total[i] = lin_to_srgb(color_total[i])

            output[y, x] = color_total

    image = Image.fromarray(output.astype(np.uint8), 'RGBA')

image.save(filename)
