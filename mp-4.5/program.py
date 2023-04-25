import sys
import numpy as np
from PIL import Image

width, height = None, None
image = None
filename = None
given_color = np.array([1, 1, 1])

spheres = []
suns = []
bulbs = []
exposure = None

eye = np.array([0, 0, 0])
forward = np.array([0, 0, -1])
right = np.array([1, 0, 0])
up = np.array([0, 1, 0])
offset = 1e-6


class Sphere:
    def __init__(self, x, y, z, r, color):
        self.center = np.array([x, y, z])
        self.radius = r
        self.color = color


class Sun:
    def __init__(self, x, y, z, color):
        self.position = np.array([x, y, z])
        self.color = color


class Bulb:
    def __init__(self, x, y, z, color):
        self.position = np.array([x, y, z])
        self.color = color


def normalize(vector):
    """
    Normalize a vector
    :param vector: the vector to normalize
    :return: the normalized vector
    """
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm


def intersect(ray_origin, ray_direction, sphere):
    """
    Intersect a ray with a sphere.
    From: https://viclw17.github.io/2018/07/16/raytracing-ray-sphere-intersection
          https://stackoverflow.com/questions/23096822/ray-sphere-intersection-method-not-working
          https://stackoverflow.com/questions/63922206/glsl-sphere-ray-intersection-geometric-solution
    :param ray_origin: the origin of the ray
    :param ray_direction: ray direction
    :param sphere: the sphere
    :return: None if no intersection, otherwise the distance from the ray origin to the intersection point
    """

    # Calculate the coefficients of the quadratic equation
    v = ray_origin - sphere.center
    a = np.dot(ray_direction, ray_direction)
    b = 2 * np.dot(v, ray_direction)
    c = np.dot(v, v) - sphere.radius * sphere.radius
    d = b * b - 4 * a * c

    # If the discriminant is negative, there is no intersection
    if d >= 0:
        x1 = (-b - np.sqrt(d)) / (2 * a)
        x2 = (-b + np.sqrt(d)) / (2 * a)
        if x1 > 0 and x2 > 0:
            return min(x1, x2)
        elif x1 > 0 or x2 > 0:
            return max(x1, x2)

    # No intersection
    return None


def ray_trace(ray_direction):
    """
    From: https://excamera.com/sphinx/article-ray.html
    Ray trace and return the color of the pixel
    :param ray_direction: the direction of the ray
    :return: the color of the pixel
    """

    # Normalize the ray direction
    ray_direction = normalize(ray_direction)

    # Find the closest intersection sphere and its intersection distance if it exists
    closest_sphere, closest_intersection = None, None
    for sphere in spheres:
        intersection = intersect(eye, ray_direction, sphere)
        if intersection and (not closest_intersection or intersection < closest_intersection):
            closest_sphere, closest_intersection = sphere, intersection

    # No intersection with any sphere
    if not closest_sphere or not closest_intersection:
        return np.array([0, 0, 0, 0]).astype(float)

    # Calculate the hit point and the normal
    hit_point = eye + closest_intersection * ray_direction
    normal = normalize(hit_point - closest_sphere.center)
    if np.dot(ray_direction, normal) > 0:
        normal = -normal

    # Calculate the color
    color = np.array([0, 0, 0]).astype(float)

    # Add color from suns
    for sun in suns:
        light_direction = normalize(sun.position)

        # Add color from sun if the hit point is not blocked by any sphere
        add_light = True
        for sphere in spheres:
            if intersect(hit_point + offset * normal, light_direction, sphere):
                add_light = False
                break
        if add_light:
            color += closest_sphere.color * sun.color * np.dot(normal, light_direction)

    # Add color from bulb if the hit point is not blocked by any sphere
    for bulb in bulbs:
        light_direction = normalize(bulb.position - hit_point)
        distance = np.linalg.norm(bulb.position - hit_point)
        fall_off = 1 / (distance * distance)

        # Check if the bulb is blocked by any sphere
        add_light = True
        for sphere in spheres:
            intersection = intersect(hit_point + offset * normal, light_direction, sphere)
            if intersection and (np.linalg.norm(hit_point + intersection * light_direction - hit_point) < distance):
                add_light = False
                break
        if add_light:
            color += closest_sphere.color * bulb.color * np.dot(normal, light_direction) * fall_off

    return np.concatenate((color, [1]))


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
            spheres.append(Sphere(np.longfloat(line[1]), np.longfloat(line[2]), np.longfloat(line[3]), np.longfloat(line[4]), given_color))

        elif line[0] == 'sun':
            suns.append(Sun(float(line[1]), float(line[2]), float(line[3]), given_color))

        elif line[0] == 'bulb':
            bulbs.append(Bulb(float(line[1]), float(line[2]), float(line[3]), given_color))

        elif line[0] == 'color':
            given_color = np.array([float(line[1]), float(line[2]), float(line[3])])

        elif line[0] == 'expose':
            exposure = float(line[1])

        elif line[0] == 'eye':
            eye = np.array([float(line[1]), float(line[2]), float(line[3])])

        else:
            sys.exit("Instruction not recognized.")

# render image
for y in range(height):
    for x in range(width):
        normalized_x = (2 * x - width) / max(width, height)
        normalized_y = (height - 2 * y) / max(width, height)
        image[y, x] = ray_trace(forward + normalized_x * right + normalized_y * up)

# convert image to sRGB
rgb = image[..., :3]
if exposure:
    rgb = 1 - np.exp(-rgb * exposure)
srgb = np.where(rgb <= 0.0031308, 12.92 * rgb, 1.055 * np.power(rgb, 1 / 2.4) - 0.055)
image[..., :3] = np.clip(srgb, 0, 1)

# save image
Image.fromarray((image * 255).astype('uint8'), mode="RGBA").save(filename)
