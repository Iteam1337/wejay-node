FROM node
COPY package.json /app/
WORKDIR /app
RUN npm install --production
COPY . /app/
CMD npm start