FROM python:3.8-slim

RUN pip install poetry

WORKDIR /app
COPY pyproject.toml poetry.lock* /app/
COPY . /app

RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

EXPOSE 5000

CMD ["python", "server.py"]
