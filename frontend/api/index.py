from mangum import Mangum

from backend_app.main import app

handler = Mangum(app)
