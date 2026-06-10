FROM python:3.11-slim
RUN useradd -u 8888 -m sandboxuser
USER sandboxuser
WORKDIR /sandbox
