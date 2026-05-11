# Fix for django-migrations Cloud Run Job command parsing issue
# The error shows: python treating "manage.py migrate --noinput" as a single filename

# Delete the broken job
gcloud run jobs delete django-migrations --region europe-west4 --quiet

# Recreate with CORRECT command format (command + args as separate items)
gcloud run jobs create django-migrations `
  --image europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/backend:latest `
  --region europe-west4 `
  --command python `
  --args manage.py,migrate,--noinput `
  --set-env-vars="MONGO_URI=mongodb+srv://Firas:kVgxCQ0M0nGyrOqS@cluster0.zsqjugz.mongodb.net/macroscanner?appName=Cluster0,DJANGO_SETTINGS_MODULE=macroscanner.settings.production,SECRET_KEY=${SECRET_KEY}"

# Alternative using exec form (if the above doesn't work)
# gcloud run jobs create django-migrations `
#   --image europe-west4-docker.pkg.dev/gymx3-494520/gym-repo/backend:latest `
#   --region europe-west4 `
#   --args "python,manage.py,migrate,--noinput"

Write-Host "Job recreated. Test with: gcloud run jobs execute django-migrations --region europe-west4"
