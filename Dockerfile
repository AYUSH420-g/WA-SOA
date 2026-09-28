# =======================================================
# Dockerfile - Lab 5 Student REST API
# Packages the Node.js / Express backend into a container
# =======================================================

# Step 1: Base Image (Node.js LTS runtime)
FROM node:20

# Step 2: Set application working directory inside container
WORKDIR /app

# Step 3: Copy package dependency definitions first (optimizes layer caching)
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy application source code into container
COPY . .

# Step 6: Expose the application listening port
EXPOSE 3000

# Step 7: Define startup command
CMD ["npm", "start"]
