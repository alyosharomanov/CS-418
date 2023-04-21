import sys
import numpy as np
from PIL import Image

width, height = None, None
image = None
filename = None
given_color = np.array([1, 1, 1]).astype(float)

spheres = []
suns = []

eye = np.array([0, 0, 0]).astype(float)
forward = np.array([0, 0, -1]).astype(float)
right = np.array([1, 0, 0]).astype(float)
up = np.array([0, 1, 0]).astype(float)


class Sphere:
    def __init__(self, x, y, z, r, color):
        self.center = np.array([x, y, z])
        self.radius = r
        self.color = color


class Sun:
    def __init__(self, x, y, z, color):
        self.position = np.array([x, y, z])
        self.color = color


def normalize(vector):
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm


def intersect(ray_origin, ray_direction, sphere):
    oc = ray_origin - sphere.center
    a = np.dot(ray_direction, ray_direction)
    b = 2 * np.dot(oc, ray_direction)
    c = np.dot(oc, oc) - sphere.radius * sphere.radius
    discriminant = b * b - 4 * a * c

    if discriminant >= 0:
        t1 = (-b - np.sqrt(discriminant)) / (2 * a)
        t2 = (-b + np.sqrt(discriminant)) / (2 * a)
        if t1 > 0 and t2 > 0:
            return min(t1, t2)
        elif t1 > 0 or t2 > 0:
            return max(t1, t2)

    return None


def ray_trace(ray_direction):
    closest_intersection, closest_sphere = None, None

    # Find the closest intersection
    for sphere in spheres:
        intersection = intersect(eye, ray_direction, sphere)
        if intersection and (not closest_intersection or intersection < closest_intersection):
            closest_intersection, closest_sphere = intersection, sphere

    # No intersection with any sphere
    if not closest_intersection:
        return np.array([0, 0, 0, 0]).astype(float)

    # Calculate the hit point
    hit_point = eye + closest_intersection * ray_direction
    normal = normalize(hit_point - closest_sphere.center)
    color = np.array([0, 0, 0]).astype(float)

    # Calculate the color
    for sun in suns:
        if not any(intersect(hit_point + 1e-6 * normal, normalize(sun.position), sphere) for sphere in spheres):
            color += closest_sphere.color * sun.color * np.dot(normal, normalize(sun.position))

    return np.concatenate((color, [1]))


def to_srgb(image):
    rgb = np.clip(image[..., :3], 0, 1)
    image[..., :3] = np.where(rgb <= 0.0031308, 12.92 * rgb, 1.055 * np.power(rgb, 1 / 2.4) - 0.055)
    return (image * 255).astype('uint8')


with open(sys.argv[1]) as f:
    for line in f.readlines():
        if line == '\n':
            continue
        line = line.split()
        print(line)

        if line[0] == 'png':
            width, height, filename = int(line[1]), int(line[2]), line[3]
            image = np.full((height, width, 4), [0, 0, 0, 1]).astype(float)

        elif line[0] == 'sphere':
            spheres.append(Sphere(float(line[1]), float(line[2]), float(line[3]), float(line[4]), given_color))

        elif line[0] == 'sun':
            suns.append(Sun(float(line[1]), float(line[2]), float(line[3]), given_color))

        elif line[0] == 'color':
            given_color = np.array([float(line[1]), float(line[2]), float(line[3])])

        else:
            sys.exit("Instruction not recognized.")

for y in range(height):
    for x in range(width):
        normalized_x = (2 * x - width) / max(width, height)
        normalized_y = (height - 2 * y) / max(width, height)
        image[y, x] = ray_trace(normalize(forward + normalized_x * right + normalized_y * up))
Image.fromarray(to_srgb(image), mode="RGBA").save(filename)
