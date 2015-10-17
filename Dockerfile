FROM node
COPY package.json /app/
WORKDIR /app
RUN npm install --production
COPY . /app/
EXPOSE 80
CMD npm start