import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;

public class Main {
    static final FastScanner fs = new FastScanner(System.in);
    static final PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));

    public static void main(String[] args) throws Exception {
        solve();
        out.flush();
    }

    static void solve() throws Exception {
        // Write solution for problem 2 here.
    }

    static final class FastScanner {
        private final InputStream in;
        private final byte[] buffer = new byte[1 << 16];
        private int ptr = 0;
        private int len = 0;

        FastScanner(InputStream in) {
            this.in = in;
        }

        private int read() throws IOException {
            if (ptr >= len) {
                len = in.read(buffer);
                ptr = 0;
                if (len <= 0) {
                    return -1;
                }
            }
            return buffer[ptr++];
        }

        String next() throws IOException {
            StringBuilder sb = new StringBuilder();
            int c;
            while ((c = read()) != -1 && c <= ' ') {
                // Skip whitespace.
            }
            if (c == -1) {
                return null;
            }
            do {
                sb.append((char) c);
                c = read();
            } while (c > ' ');
            return sb.toString();
        }

        int nextInt() throws IOException {
            return Integer.parseInt(next());
        }

        long nextLong() throws IOException {
            return Long.parseLong(next());
        }

        double nextDouble() throws IOException {
            return Double.parseDouble(next());
        }
    }
}
