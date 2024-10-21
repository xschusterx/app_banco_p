package app_banco;
/*
    private String numero;    // usado como String pq vamos usar (.) 
    private String agencia;  // agencia do banco
    private String titular; // titular da conta
    private String tipo;   // tipo de conta corrente ou poupança 
    private double saldo; // double pq usa numero quebrado 0,5  
 */


public class principal 
{
    public static void main (String[] args)
    {
        //instancia de uma classe 
        //ou criação de um novo objeto 

        contabancaria conta = new contabancaria ();


        conta.setNumero("111.111-1");
        System.out.println("numero da conta: " + conta.getNumero());
        
        conta.setAgencia("0014101");
        System.out.println("numero da agencia: "+ conta.getAgencia());
        
        conta.setTitular("carlos#");
        System.out.println("titular:" + conta.getTitular());
         
        conta.setTipo("corrente");
        System.out.println("conta: "+ conta.getTipo());

        conta.setSaldo(100.50);
        System.out.println("saldo: "+ conta.getSaldo());
        




    }




}
