interface FooterProps {
  currentYear: number;
  studentId: string;
  githubUser: string;
}

export function Footer({ currentYear, studentId, githubUser }: FooterProps) {
  return (
    <footer className="site-footer">
      <span>
        © {currentYear} {studentId}
      </span>
      <a href={`https://github.com/${githubUser}`} target="_blank" rel="noopener">
        github.com/{githubUser}
      </a>
    </footer>
  );
}
