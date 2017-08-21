test:
	- flake8 liveblog/**/*.py --exclude="**/migrations/**"
	- flake8 interactives/**/*.py --exclude="**/migrations/**"
	- flake8 foiatracker/**/*.py --exclude="**/migrations/**"
	- flake8 core/*.py --exclude="**/migrations/**"
	- coverage run --omit="venv/*,**/migrations/**,**/tests.py" ./manage.py test
	- coverage html
collectstatics3:
	- STATIC_TO_S3='on' python manage.py collectstatic
data:
	- python manage.py loaddata foiatracker/fixtures/foiatracker_testdata.json
	- python manage.py loaddata interactives/fixtures/interactives_testdata.json
	- python manage.py loaddata liveblog/fixtures/liveblog_testdata.json --database=liveblog
