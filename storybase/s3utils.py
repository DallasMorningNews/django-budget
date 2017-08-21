# Imports from other dependencies.  # NOQA
from storages.backends.s3boto import S3BotoStorage


class MediaRootS3BotoStorage(S3BotoStorage):
    def __init__(self, *args, **kwargs):
        kwargs['location'] = 'media'
        super(MediaRootS3BotoStorage, self).__init__(*args, **kwargs)
