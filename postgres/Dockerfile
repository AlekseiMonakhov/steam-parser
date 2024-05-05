FROM postgres:latest

COPY initdb.sql /docker-entrypoint-initdb.d/

CMD ["postgres", "-c", "listen_addresses=*", "-c", "max_connections=300"]
