cd C:\Users\TR054976\Documents\GitHub\StatusDiario\painel-pcm
cd Backend
.\venv\Scripts\activate

python migrate_to_db.py
python main.py

cd C:\Users\TR054976\Documents\GitHub\StatusDiario\painel-pcm
cd Frontend
npm run dev