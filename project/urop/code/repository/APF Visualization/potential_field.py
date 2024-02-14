import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# Define the range for x and y
x = np.linspace(-2, 2, 100)
y = np.linspace(-2, 2, 100)

# Create a meshgrid
X, Y = np.meshgrid(x, y)

# Define the repulsive potential with two high, steep peaks
peak_height = 5
Z_repulsive_peaks = peak_height * (np.exp(-((X - 1)**2 + (Y - 1)**2)) + np.exp(-((X + 1)**2 + (Y + 1)**2)))

# Define the attractive potential as a plane sloping downwards from right to left
Z_attractive_plane = -0.5 * (Y)

# Calculate the whole potential by combining the attractive and repulsive potentials
Z_whole_plane_peaks_visible = Z_attractive_plane + Z_repulsive_peaks

# Plotting the potentials with colorbars
fig_colorbars = plt.figure(figsize=(18, 6))

# Attractive Potential with colorbar
ax1_colorbar = fig_colorbars.add_subplot(131, projection='3d')
surf1 = ax1_colorbar.plot_surface(X, Y, Z_attractive_plane, cmap='viridis')
fig_colorbars.colorbar(surf1, ax=ax1_colorbar, shrink=0.5, aspect=10)
ax1_colorbar.set_title('Attractive Potential')




plt.show()
