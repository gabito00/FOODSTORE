from app.core.database import session_factory


class UnitOfWork:
    def __init__(self, factory=session_factory):
        self.factory = factory

    def __enter__(self):
        self.session = self.factory()
        self.setup_repositories()
        return self

    def setup_repositories(self):
        pass

    def __exit__(self, exc_type, exc, tb):
        try:
            if exc_type is None:
                try:
                    self.session.commit()
                except Exception:
                    self.session.rollback()
                    raise
            else:
                self.session.rollback()
        finally:
            self.session.close()
