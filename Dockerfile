FROM node:22 AS frontend-build
WORKDIR /usr/src/app
COPY frontend/ ./frontend/
RUN cd frontend && yarn install && yarn run build

FROM node:22 AS server-build
WORKDIR /tmp/
COPY --from=frontend-build /usr/src/app/frontend/build ./frontend/build
COPY backend/ ./backend/
RUN cd backend && npm install

EXPOSE 8080

WORKDIR /tmp/backend/
CMD ["node", "app.js"]