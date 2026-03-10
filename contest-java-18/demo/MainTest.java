import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class MainTest {
    public static void main(String[] args) throws Exception {
        Path inputPath = Path.of("input.txt");
        Path expectedPath = Path.of("expected.txt");

        String input = Files.readString(inputPath, StandardCharsets.UTF_8);
        String actualOutput = normalize(runMain(input));
        String expectedOutput = normalize(Files.readString(expectedPath, StandardCharsets.UTF_8));

        System.out.println("Actual output:");
        System.out.println(actualOutput);
        System.out.println();
        System.out.println("Expected output:");
        System.out.println(expectedOutput);
        System.out.println();
        System.out.println(expectedOutput.equals(actualOutput) ? "PASS" : "FAIL");
    }

    private static String runMain(String input) throws Exception {
        InputStream originalIn = System.in;
        PrintStream originalOut = System.out;

        ByteArrayInputStream testIn = new ByteArrayInputStream(input.getBytes(StandardCharsets.UTF_8));
        ByteArrayOutputStream testOut = new ByteArrayOutputStream();
        PrintStream captureOut = new PrintStream(testOut, true, StandardCharsets.UTF_8);

        try {
            System.setIn(testIn);
            System.setOut(captureOut);
            Main.main(new String[0]);
        } finally {
            System.setIn(originalIn);
            System.setOut(originalOut);
            captureOut.close();
        }

        return testOut.toString(StandardCharsets.UTF_8);
    }

    private static String normalize(String text) {
        return text.replace("\r\n", "\n").stripTrailing();
    }
}
