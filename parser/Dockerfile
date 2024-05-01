FROM python:3.8

RUN pip install poetry

WORKDIR /app
COPY . /app

RUN poetry config virtualenvs.create false
RUN poetry install --no-dev

# Установка зависимостей для Chromium
RUN apt-get update && apt-get install -y wget curl unzip \
    libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 libatspi2.0-0 libxshmfence1

# Установка Chromium и ChromeDriver
RUN wget https://commondatastorage.googleapis.com/chromium-browser-snapshots/Linux_x64/737173/chrome-linux.zip \
    && unzip chrome-linux.zip -d /usr/bin/ \
    && rm chrome-linux.zip
RUN wget https://chromedriver.storage.googleapis.com/90.0.4430.24/chromedriver_linux64.zip \
    && unzip chromedriver_linux64.zip -d /usr/local/bin/ \
    && rm chromedriver_linux64.zip

CMD ["python", "server.py"]
