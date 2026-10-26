# Minimal, secure container for compiling and executing Java solutions
FROM eclipse-temurin:21-alpine

# Run as non-root unprivileged sandbox user
RUN adduser -D -u 1000 sandbox
USER sandbox
WORKDIR /sandbox

CMD ["/bin/sh"]
