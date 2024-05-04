FROM selenium/standalone-chrome:124.0-chromedriver-124.0

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip install poetry

WORKDIR /app
COPY pyproject.toml poetry.lock* /app/
COPY . /app

RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

EXPOSE 5000

CMD ["python3", "app.py"]
