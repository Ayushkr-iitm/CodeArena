# Minimal, secure container for executing Python solutions
FROM python:3.12-alpine

# Run as non-root unprivileged sandbox user
RUN adduser -D -u 1000 sandbox
USER sandbox
WORKDIR /sandbox

CMD ["python3"]
