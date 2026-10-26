# Minimal, secure container for compiling and executing C++ solutions
FROM alpine:3.19

RUN apk add --no-cache g++ build-base libstdc++

# Run as non-root unprivileged sandbox user
RUN adduser -D -u 1000 sandbox
USER sandbox
WORKDIR /sandbox

CMD ["/bin/sh"]
