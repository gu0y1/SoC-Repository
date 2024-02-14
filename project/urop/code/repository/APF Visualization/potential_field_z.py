import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# Adjust the code to only display the whole potential in a top-down view

# Define the range for x and y
x = np.linspace(-2, 2, 100)
y = np.linspace(-2, 2, 100)

# Create a meshgrid
X, Y = np.meshgrid(x, y)

# Define the repulsive potential with two high, steep peaks
peak_height = 5
Z_repulsive_peaks = peak_height * (np.exp(-((X - 0.5)**2 + (Y - 0.5)**2)) + np.exp(-((X + 0.5)**2 + (Y + 0.5)**2)))

# Define the attractive potential as a plane sloping downwards from right to left
Z_attractive_plane = -0.5 * (X - Y)

# Calculate the whole potential by combining the attractive and repulsive potentials
Z_whole_plane_peaks_visible = Z_attractive_plane + Z_repulsive_peaks

# Plotting the whole potential with colorbar in a top-down view
fig, ax = plt.subplots(figsize=(6, 6))
c = ax.pcolormesh(X, Y, Z_whole_plane_peaks_visible, cmap='viridis', shading='auto')
fig.colorbar(c, ax=ax, shrink=0.5, aspect=10)
ax.set_title('Top-Down View of Whole Potential')

# Set the scale for the plot
ax.set_xlim(-2, 2)
ax.set_ylim(-2, 2)
ax.set_xticks([-2, 0, 2])
ax.set_yticks([-2, 0, 2])

plt.show()
